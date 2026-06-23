"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakBrowser, stopBrowserTts } from "@/lib/tts/browser-tts";

const audioCache = new Map<string, string>();

export function useTts() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopBrowserTts();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stop();
      setSpeaking(true);

      try {
        let audioBase64 = audioCache.get(trimmed);

        if (!audioBase64) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed }),
          });
          const data = await res.json();

          if (data.success && data.data?.audioBase64) {
            const b64 = data.data.audioBase64 as string;
            audioBase64 = b64;
            audioCache.set(trimmed, b64);
          }
        }

        if (audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setSpeaking(false);
          audio.onerror = async () => {
            setSpeaking(false);
            setSpeaking(true);
            await speakBrowser(trimmed);
            setSpeaking(false);
          };
          await audio.play();
          return;
        }
      } catch {
        // fallback abaixo
      }

      try {
        await speakBrowser(trimmed);
      } finally {
        setSpeaking(false);
      }
    },
    [stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, speaking, stop };
}
