import type { AssessmentQuestion, CEFRLevel, LearningGoal } from "@/types";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import { ASSESSMENT_QUESTIONS, checkAnswer, diagnoseLevel } from "@/lib/data/assessment-questions";
import { getAIApiKey, isAIConfigured } from "@/services/ai.service";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const REASSESS_PROMPT = (
  goal: LearningGoal,
  level: CEFRLevel,
  weaknesses: string[]
) =>
  `Create 5 English assessment questions for a Brazilian student reassessment.

Goal: ${GOAL_LABELS[goal]}
Current level: ${LEVEL_LABELS[level]} (${level})
Weak areas to test: ${weaknesses.join(", ") || "general skills"}

Mix question types: multiple_choice, fill_blank. No speaking questions.
Return ONLY a JSON array:
[
  {
    "id": "r1",
    "type": "multiple_choice" or "fill_blank",
    "question": "...",
    "options": ["a","b","c","d"],
    "correctAnswer": "...",
    "level": "${level}",
    "skillArea": "grammar" or "vocabulary" or "reading",
    "hint": "optional hint in Portuguese"
  }
]`;

function parseReassessQuestions(raw: string, level: CEFRLevel): AssessmentQuestion[] {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as AssessmentQuestion[];
  return parsed.slice(0, 5).map((q, i) => ({
    ...q,
    id: q.id || `re-${i}`,
    level: q.level || level,
  }));
}

export async function generateReassessQuestions(
  goal: LearningGoal,
  level: CEFRLevel,
  weaknesses: string[] = []
): Promise<AssessmentQuestion[]> {
  if (!isAIConfigured()) {
    return ASSESSMENT_QUESTIONS.slice(0, 5).map((q, i) => ({ ...q, id: `re-static-${i}` }));
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
          { role: "user", parts: [{ text: REASSESS_PROMPT(goal, level, weaknesses) }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) throw new Error("Gemini error");

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseReassessQuestions(content, level);
  } catch {
    return ASSESSMENT_QUESTIONS.slice(0, 5).map((q, i) => ({ ...q, id: `re-static-${i}` }));
  }
}

export function evaluateReassessAnswers(
  questions: AssessmentQuestion[],
  answers: { questionId: string; answer: string }[],
  currentLevel: CEFRLevel
) {
  const evaluatedAnswers = answers.map((a) => {
    const question = questions.find((q) => q.id === a.questionId);
    const isCorrect = question ? checkAnswer(question, a.answer) : false;
    return { questionId: a.questionId, answer: a.answer, isCorrect };
  });

  return diagnoseLevel(
    evaluatedAnswers.map((a) => ({ ...a, timeSpentMs: 0 })),
    currentLevel
  );
}
