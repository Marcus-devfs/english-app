import type { LearningGoal, CEFRLevel } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";

interface AIContext {
  goal: LearningGoal;
  level: CEFRLevel;
  userName: string;
  systemOverride?: string;
}

interface AIResponse {
  message: string;
  corrections?: { original: string; corrected: string; explanation: string }[];
}

export type AIMode = "live" | "mock";
export type MockReason = "no_key" | "api_error";
export type AIProvider = "openai" | "gemini";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

/** Server-only: GEMINI_API_KEY, AI_API_KEY, or GOOGLE_API_KEY (never NEXT_PUBLIC_) */
export function getAIApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

export function isAIConfigured(): boolean {
  return Boolean(getAIApiKey());
}

export function resolveAIProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "gemini" || explicit === "google") return "gemini";
  if (explicit === "openai") return "openai";

  const key = getAIApiKey();
  if (key.startsWith("sk-")) return "openai";
  if (key.startsWith("AIza") || key.startsWith("AQ.")) return "gemini";

  return "openai";
}

const GOAL_FOCUS: Record<LearningGoal, string> = {
  career_abroad: "international careers, relocation, job interviews abroad, networking, and working with global teams",
  travel: "travel situations: airports, hotels, restaurants, directions, emergencies, and cultural interactions",
  academic: "academic English: presentations, essays, research discussions, university life, and formal writing",
  conversation: "everyday conversation, social situations, expressing opinions, making plans, and natural small talk",
  business: "business English: emails, meetings, negotiations, presentations, and professional communication",
  tech_career: "tech careers: interviews, stand-ups, code reviews, system design, and technical discussions",
};

const GOAL_GREETING: Record<LearningGoal, string> = {
  career_abroad:
    "Hello {name}! Let's practice English for your international career. Tell me about a role or country you'd love to work in.",
  travel:
    "Hi {name}! Ready to practice travel English? Imagine you're at an airport or hotel — where are you going?",
  academic:
    "Hello {name}! Let's work on academic English. Tell me about a subject you're studying or a presentation you're preparing.",
  conversation:
    "Hey {name}! Let's have a natural conversation. Tell me about your day or something you're excited about this week.",
  business:
    "Hello {name}! Let's practice business English. Tell me about a meeting, email, or project you're working on.",
  tech_career:
    "Hi {name}! Let's practice tech English. Tell me about a project you're building or a technical challenge you've faced.",
};

const GOAL_FOLLOW_UP: Record<LearningGoal, string> = {
  career_abroad: "What part of working abroad excites you most right now?",
  travel: "What's the next travel situation you'd like to practice?",
  academic: "Can you explain your main idea in 2–3 full sentences?",
  conversation: "What would you like to talk about next?",
  business: "Can you describe a recent work situation in English?",
  tech_career: "Can you explain a technical decision you made recently?",
};

export function getGoalGreeting(ctx: AIContext): string {
  return GOAL_GREETING[ctx.goal].replace("{name}", ctx.userName.split(" ")[0]);
}

const SYSTEM_PROMPT = (ctx: AIContext) =>
  `You are Alex, a friendly English conversation partner and teacher. Your student is ${ctx.userName}, learning English for: ${GOAL_LABELS[ctx.goal]}. Their level is ${LEVEL_LABELS[ctx.level]}.

Focus areas for this student: ${GOAL_FOCUS[ctx.goal]}.

Rules:
- Always respond in English, but explain corrections in Portuguese when needed
- Correct grammar, vocabulary, and pronunciation mistakes gently
- Keep responses conversational and encouraging
- Respond directly to what the student said — never repeat your opening greeting
- Stay on topics relevant to their goal — do NOT default to tech unless their goal is tech_career
- Use scenarios and vocabulary appropriate to their goal
- If they make mistakes, provide corrections in JSON format at the end like: CORRECTIONS:[{"original":"...","corrected":"...","explanation":"..."}]
- Keep responses under 150 words unless explaining a complex topic`;

function parseAIContent(content: string): AIResponse {
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
}

function isPureGreeting(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length > 35) return false;
  return /^(hello|hi|hey|good morning|good afternoon|olá|oi)[\s!.?,]*$/i.test(trimmed);
}

function detectCorrections(message: string): AIResponse["corrections"] {
  const corrections: NonNullable<AIResponse["corrections"]> = [];

  const rules: [RegExp, string, string][] = [
    [/\btoday i working\b/i, "Today I'm working", "Present continuous: I'm working (not 'I working')."],
    [/\bi working on\b/i, "I'm working on", "Use 'I'm' before a verb ending in -ing."],
    [/\bi watch\b/i, "I watched", "For past events today, use past simple: I watched."],
    [/\bplay a soccer\b/i, "played a soccer", "Past event → past simple: played."],
    [/\bi am agree\b/i, "I agree", "Em inglês, 'agree' já é um verbo — não precisa de 'am'."],
    [/\bhe don't\b/i, "he doesn't", "Com 'he/she/it' usamos 'doesn't', não 'don't'."],
    [/\bmore better\b/i, "better", "'Better' já é comparativo — não precisa de 'more'."],
    [/\bexplain me\b/i, "explain to me", "O verbo 'explain' precisa de 'to': explain TO me."],
  ];

  for (const [pattern, corrected, explanation] of rules) {
    const match = message.match(pattern);
    if (match) {
      corrections.push({ original: match[0], corrected, explanation });
    }
  }

  return corrections.length > 0 ? corrections : undefined;
}

function buildAcknowledgment(message: string): string {
  const lower = message.toLowerCase();
  const parts: string[] = [];

  if (/web app|application|project|coding|software|developer/i.test(lower)) {
    parts.push("Working on a web application is great practice.");
  }
  if (/soccer|football|game|match|brazil/i.test(lower)) {
    parts.push("Watching a soccer game in Brazil sounds fun!");
  }
  if (/travel|trip|flight|hotel|airport/i.test(lower)) {
    parts.push("Travel stories are perfect for building fluency.");
  }
  if (/meeting|email|client|business|work/i.test(lower)) {
    parts.push("Good — professional topics help you sound confident.");
  }
  if (/study|university|class|exam|research/i.test(lower)) {
    parts.push("Academic topics are a solid way to expand your vocabulary.");
  }

  if (parts.length === 0) {
    return "Thanks for sharing! ";
  }
  return parts.join(" ") + " ";
}

function mockResponse(
  message: string,
  ctx: AIContext,
  history: { role: string; content: string }[]
): AIResponse {
  const corrections = detectCorrections(message);
  const historyCount = history.filter((m) => m.role === "user").length;

  let responseMessage: string;

  if (historyCount <= 1 && isPureGreeting(message)) {
    responseMessage = getGoalGreeting(ctx);
  } else {
    responseMessage =
      buildAcknowledgment(message) +
      (corrections?.length
        ? "I noticed a few things we can polish — check the corrections below. "
        : "Your message came through clearly. ") +
      GOAL_FOLLOW_UP[ctx.goal];
  }

  if (corrections?.length && !responseMessage.includes("corrections below")) {
    responseMessage =
      `I noticed a small correction:\n\n` +
      corrections.map((c) => `"${c.original}" → "${c.corrected}" (${c.explanation})`).join("\n") +
      `\n\n${responseMessage}`;
  }

  return { message: responseMessage, corrections };
}

async function callOpenAI(
  apiKey: string,
  ctx: AIContext,
  message: string,
  history: { role: string; content: string }[]
): Promise<AIResponse> {
  const res = await fetch(
    process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: ctx.systemOverride ?? SYSTEM_PROMPT(ctx) },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[OpenAI Error]", res.status, errBody.slice(0, 300));
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseAIContent(content);
}

async function callGemini(
  apiKey: string,
  ctx: AIContext,
  message: string,
  history: { role: string; content: string }[]
): Promise<AIResponse> {
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: ctx.systemOverride ?? SYSTEM_PROMPT(ctx) }],
        },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Gemini Error]", res.status, errBody.slice(0, 300));
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!content) {
    throw new Error("Gemini API returned empty response");
  }
  return parseAIContent(content);
}

export async function getAIResponse(
  message: string,
  ctx: AIContext,
  history: { role: string; content: string }[] = []
): Promise<AIResponse & { mode: AIMode; mockReason?: MockReason }> {
  const apiKey = getAIApiKey();

  if (!apiKey) {
    return { ...mockResponse(message, ctx, history), mode: "mock", mockReason: "no_key" };
  }

  const provider = resolveAIProvider();

  try {
    const result =
      provider === "gemini"
        ? await callGemini(apiKey, ctx, message, history)
        : await callOpenAI(apiKey, ctx, message, history);

    return { ...result, mode: "live" };
  } catch (error) {
    console.error(`[AI fallback to mock] provider=${provider}`, error);
    return { ...mockResponse(message, ctx, history), mode: "mock", mockReason: "api_error" };
  }
}
