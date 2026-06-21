import type { LearningGoal, CEFRLevel } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import {
  getAIApiKey,
  resolveAIProvider,
  type AIMode,
  type MockReason,
} from "@/services/ai.service";

interface InterviewContext {
  goal: LearningGoal;
  level: CEFRLevel;
  userName: string;
  studyContext: string;
  questionCount: number;
}

export interface InterviewAIResponse {
  message: string;
  mode: AIMode;
  mockReason?: MockReason;
}

const INTERVIEW_SYSTEM = (ctx: InterviewContext) =>
  `You are Alex, a professional English interviewer conducting a realistic job/skill interview in English.

Student: ${ctx.userName}
Goal: ${GOAL_LABELS[ctx.goal]}
Level: ${LEVEL_LABELS[ctx.level]}
Questions asked so far: ${ctx.questionCount}

Study history:
${ctx.studyContext}

Rules:
- Conduct the interview ENTIRELY in English
- Ask ONE clear question at a time — behavioral, situational, or goal-relevant
- Questions should build on topics from their completed lessons when possible
- After the student answers, briefly acknowledge (1 sentence) then ask the next question
- Gently note major grammar issues inline, e.g. "(Tip: use past tense here)"
- Keep each response under 120 words
- Be encouraging but professional — like a real interviewer
- Do NOT repeat the opening greeting after the first message
- Vary question types: experience, challenges, goals, scenarios`;

const FEEDBACK_SYSTEM = (ctx: InterviewContext) =>
  `You are Alex, an English interview coach. Analyze this interview transcript and provide structured feedback.

Student: ${ctx.userName} | Goal: ${GOAL_LABELS[ctx.goal]} | Level: ${LEVEL_LABELS[ctx.level]}
Study context: ${ctx.studyContext}

Respond ONLY with valid JSON (no markdown):
{
  "overallScore": <number 0-100>,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "summary": "2-3 sentences in Portuguese summarizing performance and next steps"
}`;

const GOAL_OPENING: Record<LearningGoal, string> = {
  career_abroad:
    "Good morning! Thank you for joining today. I'm Alex, and I'll be conducting your interview. Let's start — can you tell me about yourself and why you're interested in working abroad?",
  travel:
    "Hello! I'm Alex. Today we'll practice interview-style English for travel and hospitality contexts. Tell me — what's a travel situation where you've needed English recently?",
  academic:
    "Good afternoon! I'm Alex. Let's simulate an academic interview. Could you briefly describe your field of study and what motivated you to pursue it?",
  conversation:
    "Hi! I'm Alex. We'll practice professional conversation skills today. Start by telling me about your current role or main daily activities.",
  business:
    "Good morning! I'm Alex from the hiring team. Thank you for your time. Could you walk me through your professional background and key achievements?",
  tech_career:
    "Hello! I'm Alex, engineering manager. Thanks for joining. Let's begin — tell me about a recent project you're proud of and your role in it.",
};

export function getInterviewOpening(ctx: Omit<InterviewContext, "questionCount" | "studyContext">): string {
  return GOAL_OPENING[ctx.goal].replace("{name}", ctx.userName.split(" ")[0]);
}

function parseFeedback(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 70)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
      summary: String(parsed.summary ?? "Boa participação! Continue praticando."),
    };
  } catch {
    return null;
  }
}

async function callGemini(system: string, message: string, history: { role: string; content: string }[]) {
  const apiKey = getAIApiKey();
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = [
    ...history.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAI(system: string, message: string, history: { role: string; content: string }[]) {
  const apiKey = getAIApiKey();
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
          { role: "system", content: system },
          ...history.slice(-12),
          { role: "user", content: message },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    }
  );

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAI(system: string, message: string, history: { role: string; content: string }[]) {
  const provider = resolveAIProvider();
  return provider === "gemini"
    ? callGemini(system, message, history)
    : callOpenAI(system, message, history);
}

function mockInterviewResponse(message: string, ctx: InterviewContext): string {
  const followUps = [
    "That's interesting. Can you give me a specific example of a challenge you faced and how you handled it?",
    "Great. How do you see this experience helping you achieve your goals in English?",
    "Thank you. What would you say is your biggest strength when communicating in English?",
    "I see. Can you describe a situation where you had to explain something complex in English?",
  ];
  const idx = Math.min(ctx.questionCount, followUps.length - 1);
  if (ctx.questionCount === 0) {
    return getInterviewOpening(ctx);
  }
  return `Thank you for sharing that. ${followUps[idx]}`;
}

export async function getInterviewResponse(
  message: string,
  ctx: InterviewContext,
  history: { role: string; content: string }[] = []
): Promise<InterviewAIResponse> {
  const apiKey = getAIApiKey();
  if (!apiKey) {
    return {
      message: mockInterviewResponse(message, ctx),
      mode: "mock",
      mockReason: "no_key",
    };
  }

  try {
    const content = await callAI(INTERVIEW_SYSTEM(ctx), message, history);
    return { message: content.trim(), mode: "live" };
  } catch (error) {
    console.error("[Interview AI fallback]", error);
    return {
      message: mockInterviewResponse(message, ctx),
      mode: "mock",
      mockReason: "api_error",
    };
  }
}

export async function getInterviewFeedback(
  ctx: InterviewContext,
  transcript: { role: string; content: string }[]
) {
  const apiKey = getAIApiKey();
  const transcriptText = transcript
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  if (!apiKey) {
    return {
      overallScore: 72,
      strengths: ["Participou ativamente", "Respostas com conteúdo"],
      improvements: ["Pratique tempos verbais", "Use frases mais completas"],
      summary: "Boa simulação! Configure a IA para feedback mais detalhado.",
    };
  }

  try {
    const content = await callAI(
      FEEDBACK_SYSTEM(ctx),
      `Interview transcript:\n\n${transcriptText}`,
      []
    );
    const parsed = parseFeedback(content);
    if (parsed) return parsed;
  } catch (error) {
    console.error("[Interview feedback error]", error);
  }

  return {
    overallScore: 70,
    strengths: ["Completou a entrevista", "Demonstrou disposição para praticar"],
    improvements: ["Expanda suas respostas com mais detalhes", "Revise gramática básica"],
    summary: "Boa participação! Continue praticando entrevistas regularmente.",
  };
}
