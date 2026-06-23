"use client";

import { useCallback, useRef, useState } from "react";
import { useAudioRecorder } from "@/lib/hooks/use-audio-recorder";
import { useTts } from "@/lib/hooks/use-tts";

export type InterviewPhase =
  | "idle"
  | "ai_speaking"
  | "ready"
  | "listening"
  | "transcribing"
  | "thinking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useInterviewVoice() {
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [lastAiText, setLastAiText] = useState("");
  const [lastUserText, setLastUserText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const { speak, speaking, stop: stopTts } = useTts();
  const {
    isRecording,
    isTranscribing,
    displayText,
    micError,
    start: startRecording,
    stop: stopRecording,
    reset: resetRecording,
  } = useAudioRecorder();

  const speakAndWait = useCallback(
    async (text: string) => {
      setPhase("ai_speaking");
      setLastAiText(text);
      await speak(text);
      setPhase("ready");
    },
    [speak]
  );

  const startInterview = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setPhase("thinking");
    resetRecording();
    stopTts();

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Não foi possível iniciar a entrevista.");
        setPhase("idle");
        return;
      }

      const opening = data.data.message as Message;
      setSessionId(data.data.sessionId);
      setMessages([opening]);
      setQuestionCount(1);
      setLastUserText("");
      await speakAndWait(opening.content);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPhase("idle");
    } finally {
      busyRef.current = false;
    }
  }, [resetRecording, speakAndWait, stopTts]);

  const resumeSession = useCallback(
    async (id: string, existingMessages: Message[]) => {
      setSessionId(id);
      setMessages(existingMessages);
      const assistantCount = existingMessages.filter((m) => m.role === "assistant").length;
      setQuestionCount(assistantCount);
      const lastAssistant = [...existingMessages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        setLastAiText(lastAssistant.content);
        setPhase("ready");
      }
    },
    []
  );

  const sendAnswer = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim() || busyRef.current) return;

      busyRef.current = true;
      setError(null);
      setLastUserText(text.trim());
      setPhase("thinking");

      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "message",
            sessionId,
            message: text.trim(),
          }),
        });
        const data = await res.json();

        if (!data.success) {
          setMessages((prev) => prev.slice(0, -1));
          setError(data.error ?? "Não foi possível enviar sua resposta.");
          setPhase("ready");
          return;
        }

        const aiMsg = data.data.message as Message;
        setMessages((prev) => [...prev, aiMsg]);
        setQuestionCount(data.data.questionCount ?? questionCount + 1);
        await speakAndWait(aiMsg.content);
      } catch {
        setMessages((prev) => prev.slice(0, -1));
        setError("Erro de conexão. Tente novamente.");
        setPhase("ready");
      } finally {
        busyRef.current = false;
      }
    },
    [questionCount, sessionId, speakAndWait]
  );

  const toggleMic = useCallback(async () => {
    if (phase === "ai_speaking" || phase === "thinking" || isTranscribing) return;

    if (isRecording) {
      setPhase("transcribing");
      const text = await stopRecording();
      if (text?.trim()) {
        await sendAnswer(text);
      } else {
        setPhase("ready");
      }
    } else {
      resetRecording();
      setLastUserText("");
      const ok = await startRecording();
      if (ok) setPhase("listening");
    }
  }, [
    isRecording,
    isTranscribing,
    phase,
    resetRecording,
    sendAnswer,
    startRecording,
    stopRecording,
  ]);

  const finishInterview = useCallback(async () => {
    if (!sessionId || busyRef.current) return null;
    busyRef.current = true;
    setError(null);
    stopTts();
    setPhase("thinking");

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", sessionId }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Não foi possível finalizar.");
        setPhase("ready");
        return null;
      }

      setSessionId(null);
      setPhase("idle");
      return data.data.feedback as {
        overallScore: number;
        strengths: string[];
        improvements: string[];
        summary: string;
      };
    } catch {
      setError("Erro de conexão.");
      setPhase("ready");
      return null;
    } finally {
      busyRef.current = false;
    }
  }, [sessionId, stopTts]);

  const reset = useCallback(() => {
    stopTts();
    resetRecording();
    setSessionId(null);
    setMessages([]);
    setQuestionCount(0);
    setLastAiText("");
    setLastUserText("");
    setError(null);
    setPhase("idle");
    busyRef.current = false;
  }, [resetRecording, stopTts]);

  const micDisabled =
    phase === "ai_speaking" ||
    phase === "thinking" ||
    isTranscribing ||
    speaking ||
    (!sessionId && phase !== "idle");

  const effectivePhase: InterviewPhase =
    isTranscribing ? "transcribing" : speaking ? "ai_speaking" : phase;

  return {
    phase: effectivePhase,
    sessionId,
    messages,
    questionCount,
    lastAiText,
    lastUserText: lastUserText || displayText,
    error: error ?? micError,
    isRecording,
    micDisabled,
    startInterview,
    resumeSession,
    toggleMic,
    finishInterview,
    reset,
  };
}
