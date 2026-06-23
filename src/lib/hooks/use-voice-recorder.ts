"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecognition, type ISpeechRecognition, type ISpeechRecognitionEvent } from "@/lib/speech";

export function useVoiceRecorder(lang = "en-US") {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalPartsRef = useRef<string[]>([]);
  const interimRef = useRef("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    recognitionRef.current = getSpeechRecognition();
    return () => {
      isRecordingRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const getFullTranscript = useCallback(() => {
    const final = finalPartsRef.current.join(" ").trim();
    const interim = interimRef.current.trim();
    return (final + (interim ? " " + interim : "")).trim();
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setTranscript(finalPartsRef.current.join(" ").trim());
      setInterimTranscript(interimRef.current.trim());
    });
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      setMicError("Seu navegador não suporta reconhecimento de voz.");
      return false;
    }

    finalPartsRef.current = [];
    interimRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setMicError(null);

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalPartsRef.current.push(text);
        } else {
          interim += text;
        }
      }
      interimRef.current = interim.trim();
      scheduleUpdate();
    };

    rec.onerror = (event: Event) => {
      const err = event as Event & { error?: string };
      if (err.error === "not-allowed" || err.error === "service-not-allowed") {
        isRecordingRef.current = false;
        setIsRecording(false);
        setMicError("Permissão do microfone negada. Ative nas configurações do navegador.");
      } else if (err.error === "no-speech") {
        // Browser timeout — keep recording session alive
      } else if (err.error === "aborted") {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    rec.onend = () => {
      if (isRecordingRef.current) {
        try {
          rec.start();
        } catch {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      }
    };

    isRecordingRef.current = true;
    setIsRecording(true);

    try {
      rec.start();
      return true;
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      setMicError("Não foi possível iniciar o microfone. Tente novamente.");
      return false;
    }
  }, [lang, scheduleUpdate]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);

    const full = getFullTranscript();
    finalPartsRef.current = full ? [full] : [];
    interimRef.current = "";
    setTranscript(full);
    setInterimTranscript("");
    return full;
  }, [getFullTranscript]);

  const reset = useCallback(() => {
    finalPartsRef.current = [];
    interimRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setMicError(null);
  }, []);

  const displayText = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  return {
    isRecording,
    transcript,
    interimTranscript,
    displayText,
    micError,
    start,
    stop,
    reset,
    getFullTranscript,
    isSupported: !!recognitionRef.current || typeof window !== "undefined",
  };
}
