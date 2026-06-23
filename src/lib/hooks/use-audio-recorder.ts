"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function pickMimeType(): string {
  if (typeof window === "undefined") return "audio/webm";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [transcribeSource, setTranscribeSource] = useState<"gemini" | "browser" | null>(
    null
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const transcribeBlob = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    setMicError(null);

    try {
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const res = await fetch("/api/speech/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: blob.type || "audio/webm",
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.transcript) {
        setTranscript(data.data.transcript);
        setTranscribeSource(data.data.source ?? "gemini");
        return data.data.transcript as string;
      }

      setMicError("Não foi possível transcrever o áudio. Tente falar mais perto do microfone.");
      return "";
    } catch {
      setMicError("Erro ao transcrever. Tente novamente.");
      return "";
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const start = useCallback(async () => {
    setMicError(null);
    setTranscript("");
    setTranscribeSource(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);
      return true;
    } catch {
      setMicError("Permissão do microfone negada ou indisponível.");
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return transcript;
    }

    setIsRecording(false);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        resolve(new Blob(chunksRef.current, { type }));
      };
      recorder.stop();
      cleanupStream();
    });

    if (blob.size < 1000) {
      setMicError("Gravação muito curta. Segure o botão e fale a frase inteira.");
      return "";
    }

    return transcribeBlob(blob);
  }, [cleanupStream, transcribeBlob, transcript]);

  const reset = useCallback(() => {
    cleanupStream();
    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setTranscript("");
    setMicError(null);
    setTranscribeSource(null);
  }, [cleanupStream]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    displayText: transcript,
    micError,
    transcribeSource,
    start,
    stop,
    reset,
    isSupported: typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
  };
}
