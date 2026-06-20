import type { LearningGoal, CEFRLevel } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";

interface AIContext {
  goal: LearningGoal;
  level: CEFRLevel;
  userName: string;
}

interface AIResponse {
  message: string;
  corrections?: { original: string; corrected: string; explanation: string }[];
}

const SYSTEM_PROMPT = (ctx: AIContext) =>
  `You are an expert English teacher named Alex. Your student is ${ctx.userName}, learning English for: ${GOAL_LABELS[ctx.goal]}. Their level is ${LEVEL_LABELS[ctx.level]}.

Rules:
- Always respond in English, but explain corrections in Portuguese when needed
- Correct grammar, vocabulary, and pronunciation mistakes gently
- Keep responses conversational and encouraging
- Focus on practical English related to their goal
- If they make mistakes, provide corrections in JSON format at the end like: CORRECTIONS:[{"original":"...","corrected":"...","explanation":"..."}]
- Keep responses under 150 words unless explaining a complex topic`;

function mockResponse(message: string, ctx: AIContext): AIResponse {
  const lower = message.toLowerCase();
  const corrections: AIResponse["corrections"] = [];

  const commonMistakes: [RegExp, string, string][] = [
    [/\bi am agree\b/i, "I agree", "Em inglês, 'agree' já é um verbo — não precisa de 'am'."],
    [/\bhe don't\b/i, "he doesn't", "Com 'he/she/it' usamos 'doesn't', não 'don't'."],
    [/\bi have (\d+) years\b/i, "I have $1 years", "Correto! Mas também pode usar 'I've been working for $1 years'."],
    [/\bmore better\b/i, "better", "'Better' já é comparativo — não precisa de 'more'."],
    [/\bexplain me\b/i, "explain to me", "O verbo 'explain' precisa de 'to': explain TO me."],
  ];

  for (const [pattern, corrected, explanation] of commonMistakes) {
    if (pattern.test(message)) {
      corrections.push({
        original: message.match(pattern)?.[0] ?? message,
        corrected,
        explanation,
      });
    }
  }

  const responses: Record<string, string> = {
    greeting: `Hello ${ctx.userName}! Great to practice with you today. Since you're focused on ${GOAL_LABELS[ctx.goal]}, let's talk about that. Tell me — what did you do yesterday related to your work or studies?`,
    job: `That's interesting! When talking about your job in interviews, try using strong action verbs like "developed", "led", or "implemented". Can you tell me about a project you're proud of?`,
    default: `Good effort! Keep practicing — every conversation makes you better. Try to use complete sentences and don't be afraid to make mistakes. What would you like to talk about next?`,
  };

  let responseMessage = responses.default;
  if (/hello|hi|hey|good morning|good afternoon/i.test(lower)) {
    responseMessage = responses.greeting;
  } else if (/work|job|developer|engineer|company/i.test(lower)) {
    responseMessage = responses.job;
  }

  if (corrections.length > 0) {
    responseMessage =
      `I noticed a small correction:\n\n` +
      corrections.map((c) => `"${c.original}" → "${c.corrected}" (${c.explanation})`).join("\n") +
      `\n\nNow, ${responseMessage}`;
  }

  return { message: responseMessage, corrections: corrections.length > 0 ? corrections : undefined };
}

export async function getAIResponse(
  message: string,
  ctx: AIContext,
  history: { role: string; content: string }[] = []
): Promise<AIResponse> {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    return mockResponse(message, ctx);
  }

  try {
    const res = await fetch(process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT(ctx) },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error("AI API error");

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    const correctionsMatch = content.match(/CORRECTIONS:(\[[\s\S]*?\])/);
    let corrections: AIResponse["corrections"];
    let cleanMessage = content;

    if (correctionsMatch) {
      try {
        corrections = JSON.parse(correctionsMatch[1]);
        cleanMessage = content.replace(/CORRECTIONS:\[[\s\S]*?\]/, "").trim();
      } catch {
        // ignore parse errors
      }
    }

    return { message: cleanMessage, corrections };
  } catch {
    return mockResponse(message, ctx);
  }
}
