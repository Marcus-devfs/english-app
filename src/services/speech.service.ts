import type { StepCheckResult } from "@/lib/lessons/build-steps";
import { evaluateSpeech } from "@/lib/lessons/build-steps";
import { getAIApiKey, isAIConfigured } from "@/services/ai.service";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const SPEECH_PROMPT = (transcript: string, targetPhrase: string) =>
  `You are an English pronunciation coach for Brazilian students.

Target phrase: "${targetPhrase}"
Student said: "${transcript}"

Evaluate if the student communicated the target phrase adequately (not perfect pronunciation required).
Return ONLY valid JSON:
{
  "passed": true or false,
  "score": 0-100,
  "missing": ["word1", "word2"],
  "message": "Feedback in Portuguese, encouraging, 1-2 sentences"
}

Rules:
- passed=true if score>=60
- missing: words from target phrase not clearly said (max 6)
- Be encouraging; partial credit is OK for intermediate learners`;

function parseSpeechResult(raw: string, fallback: StepCheckResult): StepCheckResult {
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      passed: boolean;
      score: number;
      missing: string[];
      message: string;
    };
    return {
      passed: parsed.passed ?? parsed.score >= 60,
      score: Math.min(100, Math.max(0, parsed.score ?? 0)),
      missing: (parsed.missing ?? []).slice(0, 6).map((w) => `Fale «${w}» com mais clareza`),
      incorrect: [],
      message: parsed.message ?? fallback.message,
    };
  } catch {
    return fallback;
  }
}

export async function evaluateSpeechWithAI(
  transcript: string,
  targetPhrase: string
): Promise<StepCheckResult> {
  const fallback = evaluateSpeech(transcript, targetPhrase);

  if (!isAIConfigured() || !transcript.trim()) {
    return fallback;
  }

  const apiKey = getAIApiKey();
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: SPEECH_PROMPT(transcript, targetPhrase) }] },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!content) return fallback;

    return parseSpeechResult(content, fallback);
  } catch {
    return fallback;
  }
}
