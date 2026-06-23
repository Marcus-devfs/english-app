import type { CEFRLevel, DailyLesson, LearningGoal } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import { getDailyLessonForTrail } from "@/lib/data/lessons";
import {
  getAIApiKey,
  isAIConfigured,
  resolveAIProvider,
  type AIProvider,
} from "@/services/ai.service";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GOAL_FOCUS: Record<LearningGoal, string> = {
  career_abroad: "international careers, job interviews, relocation",
  travel: "travel: airports, hotels, restaurants, directions",
  academic: "academic English: presentations, essays, research",
  conversation: "everyday conversation and social situations",
  business: "business English: emails, meetings, negotiations",
  tech_career: "tech careers: stand-ups, PRs, interviews, system design",
};

const LESSON_PROMPT = (
  goal: LearningGoal,
  level: CEFRLevel,
  trailTitle: string,
  trailIndex: number
) =>
  `You are an English teacher creating a daily micro-lesson for a Brazilian student.

Student goal: ${GOAL_LABELS[goal]}
Focus: ${GOAL_FOCUS[goal]}
CEFR level: ${LEVEL_LABELS[level]} (${level})
Trail lesson title: "${trailTitle}"
Lesson number in trail: ${trailIndex + 1}

Create a lesson that matches the trail title. Return ONLY valid JSON (no markdown):
{
  "title": "Short title in Portuguese matching the trail theme",
  "phrase": "Main English phrase (1-2 sentences, level ${level})",
  "translation": "Portuguese translation",
  "context": "When to use this phrase (1 sentence in Portuguese)",
  "vocabulary": [
    { "word": "english word", "meaning": "português" }
  ],
  "grammarTip": "Short grammar tip in Portuguese"
}

Include 3-4 vocabulary items. Phrase must be practical for the student's goal.`;

function parseLessonJson(
  raw: string,
  goal: LearningGoal,
  level: CEFRLevel,
  trailIndex: number,
  trailTitle: string
): DailyLesson {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    title: string;
    phrase: string;
    translation: string;
    context: string;
    vocabulary: { word: string; meaning: string }[];
    grammarTip: string;
  };

  if (!parsed.phrase || !parsed.translation) {
    throw new Error("Invalid lesson format");
  }

  return {
    id: `ai-lesson-${goal}-${trailIndex}-${Date.now()}`,
    title: parsed.title || trailTitle,
    phrase: parsed.phrase,
    translation: parsed.translation,
    context: parsed.context ?? "",
    goal,
    level,
    vocabulary: parsed.vocabulary?.slice(0, 5) ?? [],
    grammarTip: parsed.grammarTip ?? "",
  };
}

async function callGeminiLesson(
  apiKey: string,
  goal: LearningGoal,
  level: CEFRLevel,
  trailTitle: string,
  trailIndex: number
): Promise<DailyLesson> {
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: LESSON_PROMPT(goal, level, trailTitle, trailIndex) }],
      },
      contents: [{ role: "user", parts: [{ text: "Generate the lesson now." }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!content) throw new Error("Empty lesson response");
  return parseLessonJson(content, goal, level, trailIndex, trailTitle);
}

export type LessonSource = "ai" | "static";

export async function generateDailyLesson(
  goal: LearningGoal,
  level: CEFRLevel,
  trailIndex: number,
  trailTitle: string
): Promise<{ lesson: DailyLesson; source: LessonSource }> {
  const staticLesson = getDailyLessonForTrail(goal, level, trailIndex, trailTitle);

  if (!isAIConfigured()) {
    return { lesson: staticLesson, source: "static" };
  }

  const apiKey = getAIApiKey();
  const provider: AIProvider = resolveAIProvider();

  try {
    if (provider !== "gemini") {
      return { lesson: staticLesson, source: "static" };
    }
    const lesson = await callGeminiLesson(apiKey, goal, level, trailTitle, trailIndex);
    return { lesson, source: "ai" };
  } catch (error) {
    console.error("[Lesson fallback to static]", error);
    return { lesson: staticLesson, source: "static" };
  }
}
