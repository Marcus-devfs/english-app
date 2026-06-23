import { getAIApiKey, isAIConfigured } from "@/services/ai.service";
import { pcmToWavBase64 } from "@/lib/tts/pcm-to-wav";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const TTS_MODELS = [
  process.env.TTS_MODEL,
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-pro-preview-tts",
  "gemini-3.1-flash-tts-preview",
].filter((m): m is string => Boolean(m));

const DEFAULT_VOICE = process.env.TTS_VOICE ?? "Kore";

function buildTtsPrompt(text: string): string {
  return `Read the following English phrase naturally and clearly for a language learner. Speak at a moderate pace with natural pronunciation. Do not add extra words.\n\n"${text}"`;
}

async function callGeminiTts(
  apiKey: string,
  model: string,
  text: string
): Promise<string | null> {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildTtsPrompt(text) }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error(`[Gemini TTS ${model}]`, res.status, err.slice(0, 200));
    return null;
  }

  const data = await res.json();
  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) return null;

  const mime = inlineData.mimeType ?? "";
  if (mime.includes("wav")) {
    return inlineData.data as string;
  }

  return pcmToWavBase64(inlineData.data as string);
}

export type TtsSource = "gemini" | "browser";

export async function generateSpeechAudio(
  text: string
): Promise<{ audioBase64: string; mimeType: string; source: TtsSource; model?: string } | null> {
  if (!isAIConfigured()) return null;

  const apiKey = getAIApiKey();
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return null;

  for (const model of TTS_MODELS) {
    const audioBase64 = await callGeminiTts(apiKey, model, trimmed);
    if (audioBase64) {
      return {
        audioBase64,
        mimeType: "audio/wav",
        source: "gemini",
        model,
      };
    }
  }

  return null;
}
