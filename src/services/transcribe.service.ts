import { getAIApiKey, isAIConfigured } from "@/services/ai.service";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const TRANSCRIBE_PROMPT =
  "Transcribe exactly what the speaker said in English. Return ONLY the spoken text with normal English spelling and punctuation. Do not add commentary or translation.";

const TRANSCRIBE_MODELS = [
  process.env.TRANSCRIBE_MODEL,
  process.env.AI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter((m): m is string => Boolean(m));

export async function transcribeAudioWithGemini(
  audioBase64: string,
  mimeType: string
): Promise<string | null> {
  if (!isAIConfigured()) return null;

  const apiKey = getAIApiKey();

  for (const model of TRANSCRIBE_MODELS) {
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: audioBase64,
                  },
                },
                { text: TRANSCRIBE_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!res.ok) {
        console.error(`[Gemini transcribe ${model}]`, res.status);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text.replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error(`[Gemini transcribe ${model}]`, error);
    }
  }

  return null;
}
