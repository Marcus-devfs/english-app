import type { CEFRLevel, LearningGoal, QuizQuestion } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import { QUIZ_QUESTIONS } from "@/lib/data/lessons";
import {
  getAIApiKey,
  isAIConfigured,
  resolveAIProvider,
  type AIProvider,
} from "@/services/ai.service";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GOAL_FOCUS: Record<LearningGoal, string> = {
  career_abroad: "international careers, relocation, job interviews abroad",
  travel: "travel situations: airports, hotels, restaurants, directions",
  academic: "academic English: presentations, essays, university life",
  conversation: "everyday conversation, social situations, expressing opinions",
  business: "business English: emails, meetings, negotiations",
  tech_career: "tech careers: interviews, stand-ups, code reviews, technical discussions",
};

const QUIZ_PROMPT = (goal: LearningGoal, level: CEFRLevel) =>
  `You are an English teacher creating a multiple-choice quiz for a Brazilian student.

Student goal: ${GOAL_LABELS[goal]}
Focus: ${GOAL_FOCUS[goal]}
CEFR level: ${LEVEL_LABELS[level]} (${level})

Generate exactly 5 multiple-choice questions in English. Each question must:
- Be relevant to the student's goal and appropriate for level ${level}
- Have exactly 4 options (strings)
- Have one clearly correct answer
- Include a short explanation in Portuguese (1 sentence)

Return ONLY a valid JSON array with this exact shape (no markdown, no extra text):
[
  {
    "question": "Question text in English",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": "exact text of the correct option",
    "explanation": "Explicação curta em português"
  }
]`;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getStaticQuiz(goal: LearningGoal, level: CEFRLevel): QuizQuestion[] {
  const filtered = QUIZ_QUESTIONS.filter(
    (q) => q.goal === goal || q.level === level
  );
  const pool = filtered.length >= 5 ? filtered : QUIZ_QUESTIONS;
  return shuffle(pool).slice(0, 5).map((q, i) => ({
    ...q,
    id: `static-${q.id}-${i}`,
  }));
}

function parseQuizJson(raw: string, goal: LearningGoal, level: CEFRLevel): QuizQuestion[] {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];

  if (!Array.isArray(parsed) || parsed.length < 3) {
    throw new Error("Invalid quiz format");
  }

  return parsed.slice(0, 5).map((q, i) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer) {
      throw new Error(`Invalid question at index ${i}`);
    }
    return {
      id: `ai-${Date.now()}-${i}`,
      question: q.question,
      options: q.options.slice(0, 4),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? "",
      goal,
      level,
    };
  });
}

async function callGeminiQuiz(
  apiKey: string,
  goal: LearningGoal,
  level: CEFRLevel
): Promise<QuizQuestion[]> {
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: QUIZ_PROMPT(goal, level) }] },
      contents: [{ role: "user", parts: [{ text: "Generate the quiz now." }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Gemini Quiz Error]", res.status, errBody.slice(0, 300));
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!content) throw new Error("Empty quiz response");
  return parseQuizJson(content, goal, level);
}

async function callOpenAIQuiz(
  apiKey: string,
  goal: LearningGoal,
  level: CEFRLevel
): Promise<QuizQuestion[]> {
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
          { role: "system", content: QUIZ_PROMPT(goal, level) },
          { role: "user", content: "Generate the quiz now." },
        ],
        max_tokens: 2000,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(content);
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  return parseQuizJson(JSON.stringify(questions), goal, level);
}

export type QuizSource = "ai" | "static";

export async function generateQuiz(
  goal: LearningGoal,
  level: CEFRLevel
): Promise<{ questions: QuizQuestion[]; source: QuizSource }> {
  const apiKey = getAIApiKey();

  if (!isAIConfigured()) {
    return { questions: getStaticQuiz(goal, level), source: "static" };
  }

  const provider: AIProvider = resolveAIProvider();

  try {
    const questions =
      provider === "gemini"
        ? await callGeminiQuiz(apiKey, goal, level)
        : await callOpenAIQuiz(apiKey, goal, level);
    return { questions, source: "ai" };
  } catch (error) {
    console.error("[Quiz fallback to static]", error);
    return { questions: getStaticQuiz(goal, level), source: "static" };
  }
}

export function stripCorrectAnswers(questions: QuizQuestion[]) {
  return questions.map(({ id, question, options, goal, level }) => ({
    id,
    question,
    options,
    goal,
    level,
  }));
}
