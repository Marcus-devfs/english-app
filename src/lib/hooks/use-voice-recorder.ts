"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecognition, type ISpeechRecognition, type ISpeechRecognitionEvent } from "@/lib/speech";

export function useVoiceRecorder(lang = "en-US") {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalPartsRef = useRef<string[]>([]);

  useEffect(() => {
    recognitionRef.current = getSpeechRecognition();
    return () => {
      isRecordingRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const getFullTranscript = useCallback(() => {
    const final = finalPartsRef.current.join(" ").trim();
    const interim = interimTranscript.trim();
    return (final + (interim ? " " + interim : "")).trim();
  }, [interimTranscript]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return false;

    finalPartsRef.current = [];
    setTranscript("");
    setInterimTranscript("");

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
      setTranscript(finalPartsRef.current.join(" ").trim());
      setInterimTranscript(interim.trim());
    };

    rec.onerror = (event: Event) => {
      const err = event as Event & { error?: string };
      if (err.error === "not-allowed" || err.error === "service-not-allowed") {
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
      return false;
    }
  }, [lang]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);

    const final = finalPartsRef.current.join(" ").trim();
    const full = (final + (interimTranscript ? " " + interimTranscript : "")).trim();
    setTranscript(full);
    setInterimTranscript("");
    return full;
  }, [interimTranscript]);

  const reset = useCallback(() => {
    finalPartsRef.current = [];
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const displayText = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  return {
    isRecording,
    transcript,
    interimTranscript,
    displayText,
    start,
    stop,
    reset,
    getFullTranscript,
    isSupported: !!recognitionRef.current || typeof window !== "undefined",
  };
}
