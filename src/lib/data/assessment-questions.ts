import type { AssessmentQuestion, CEFRLevel } from "@/types";

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    type: "fill_blank",
    question: "I ___ to work every day by bus.",
    correctAnswer: "go",
    level: "A2",
    skillArea: "grammar",
    hint: "Present simple, first person",
  },
  {
    id: "q2",
    type: "multiple_choice",
    question: "Choose the correct sentence:",
    options: [
      "She don't like coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
      "She doesn't likes coffee.",
    ],
    correctAnswer: "She doesn't like coffee.",
    level: "A2",
    skillArea: "grammar",
  },
  {
    id: "q3",
    type: "fill_blank",
    question: "If I ___ more time, I would learn another language.",
    correctAnswer: "had",
    level: "B1",
    skillArea: "grammar",
    hint: "Second conditional",
  },
  {
    id: "q4",
    type: "multiple_choice",
    question: "What does 'deadline' mean in a work context?",
    options: [
      "A line that is no longer alive",
      "The final date to complete something",
      "A type of meeting",
      "A work break",
    ],
    correctAnswer: "The final date to complete something",
    level: "B1",
    skillArea: "vocabulary",
  },
  {
    id: "q5",
    type: "fill_blank",
    question: "The project has been ___ for three months now.",
    correctAnswer: "running",
    level: "B2",
    skillArea: "grammar",
    hint: "Present perfect continuous",
  },
  {
    id: "q6",
    type: "multiple_choice",
    question: "Which word best completes: 'We need to ___ the scope of the project.'",
    options: ["define", "defeat", "defer", "deflect"],
    correctAnswer: "define",
    level: "B2",
    skillArea: "vocabulary",
  },
  {
    id: "q7",
    type: "fill_blank",
    question: "Had I known about the meeting, I ___ attended.",
    correctAnswer: "would have",
    level: "C1",
    skillArea: "grammar",
    hint: "Third conditional",
  },
  {
    id: "q8",
    type: "speaking",
    question:
      "Describe your current job or what you do in 2-3 sentences. Speak clearly in English.",
    correctAnswer: "speaking_response",
    level: "B1",
    skillArea: "speaking",
    hint: "Use present simple. Example: 'I work as a developer. I build web applications.'",
  },
];

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
}

export function checkAnswer(
  question: AssessmentQuestion,
  userAnswer: string
): boolean {
  if (question.type === "speaking") {
    const words = userAnswer.trim().split(/\s+/).filter(Boolean);
    return words.length >= 5;
  }

  const normalized = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(question.correctAnswer);

  if (question.type === "fill_blank") {
    return normalized === correct || normalized.includes(correct);
  }

  return normalized === correct;
}

export function diagnoseLevel(
  answers: { questionId: string; isCorrect: boolean }[],
  selfAssessed: CEFRLevel
): {
  level: CEFRLevel;
  score: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
} {
  const levelScores: Record<CEFRLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  const skillBreakdown: Record<string, { correct: number; total: number }> = {
    grammar: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 },
  };

  for (const answer of answers) {
    const question = ASSESSMENT_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;

    levelScores[question.level].total++;
    skillBreakdown[question.skillArea].total++;

    if (answer.isCorrect) {
      levelScores[question.level].correct++;
      skillBreakdown[question.skillArea].correct++;
    }
  }

  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  const score = Math.round((totalCorrect / totalQuestions) * 100);

  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  let diagnosedLevel: CEFRLevel = "A1";

  for (const level of [...levels].reverse()) {
    const ls = levelScores[level];
    if (ls.total > 0 && ls.correct / ls.total >= 0.5) {
      diagnosedLevel = level;
      break;
    }
  }

  if (score >= 80 && diagnosedLevel !== "C2") {
    const idx = levels.indexOf(diagnosedLevel);
    if (idx < levels.length - 1) diagnosedLevel = levels[idx + 1];
  } else if (score < 40) {
    diagnosedLevel = "A2";
  }

  const skillPercentages: Record<string, number> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [skill, data] of Object.entries(skillBreakdown)) {
    if (data.total === 0) continue;
    const pct = Math.round((data.correct / data.total) * 100);
    skillPercentages[skill] = pct;
    if (pct >= 70) strengths.push(skill);
    if (pct < 50) weaknesses.push(skill);
  }

  const skillLabels: Record<string, string> = {
    grammar: "gramática",
    vocabulary: "vocabulário",
    reading: "leitura",
    speaking: "fala",
  };

  const weakLabels = weaknesses.map((w) => skillLabels[w] ?? w);
  const recommendation =
    weakLabels.length > 0
      ? `Seu nível real é ${diagnosedLevel}. Foque em melhorar ${weakLabels.join(" e ")}. Sua autoavaliação era ${selfAssessed} — vamos calibrar sua trilha de acordo!`
      : `Excelente! Seu nível real é ${diagnosedLevel}. Você está pronto para uma trilha desafiadora!`;

  return {
    level: diagnosedLevel,
    score,
    skillBreakdown: skillPercentages,
    strengths,
    weaknesses,
    recommendation,
  };
}
