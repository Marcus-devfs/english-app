export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LearningGoal =
  | "career_abroad"
  | "travel"
  | "academic"
  | "conversation"
  | "business"
  | "tech_career";

export type QuestionType = "fill_blank" | "multiple_choice" | "speaking";

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  level: CEFRLevel;
  skillArea: "grammar" | "vocabulary" | "reading" | "speaking";
  hint?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpentMs?: number;
}

export interface AssessmentResult {
  selfAssessedLevel: CEFRLevel;
  diagnosedLevel: CEFRLevel;
  score: number;
  totalQuestions: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface UserProgress {
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  lessonsCompleted: number;
  quizzesCompleted: number;
  totalStudyMinutes: number;
  streakDays: number;
  lastStudyDate?: string;
  grammarScore: number;
  vocabularyScore: number;
  speakingScore: number;
  readingScore: number;
  xp: number;
}

export interface DailyLesson {
  id: string;
  title: string;
  phrase: string;
  translation: string;
  context: string;
  goal: LearningGoal;
  level: CEFRLevel;
  vocabulary: { word: string; meaning: string }[];
  grammarTip: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  goal: LearningGoal;
  level: CEFRLevel;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  corrections?: { original: string; corrected: string; explanation: string }[];
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: "achievement" | "reminder" | "streak" | "tip" | "level_up";
  title: string;
  message: string;
  icon?: string;
  read: boolean;
  createdAt: Date;
}

export const GOAL_LABELS: Record<LearningGoal, string> = {
  career_abroad: "Carreira internacional",
  travel: "Viagens",
  academic: "Estudos acadêmicos",
  conversation: "Conversação fluente",
  business: "Inglês para negócios",
  tech_career: "Carreira em tecnologia",
};

export const LEVEL_LABELS: Record<CEFRLevel, string> = {
  A1: "Iniciante (A1)",
  A2: "Básico (A2)",
  B1: "Intermediário (B1)",
  B2: "Intermediário avançado (B2)",
  C1: "Avançado (C1)",
  C2: "Proficiente (C2)",
};

export const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
