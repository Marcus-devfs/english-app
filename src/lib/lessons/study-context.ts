import type { LearningGoal, CEFRLevel } from "@/types";
import { LessonCompletion } from "@/models/LessonCompletion";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";

export interface StudyContextExtras {
  userName?: string;
  streakDays?: number;
  lessonsCompleted?: number;
  xp?: number;
  speakingScore?: number;
}

export async function buildStudyContext(
  userId: string,
  goal: LearningGoal,
  level: CEFRLevel,
  extras?: StudyContextExtras
): Promise<string> {
  const completions = await LessonCompletion.find({ userId, isReview: false })
    .sort({ completedAt: -1 })
    .limit(12)
    .lean();

  const profileLines = [
    extras?.userName ? `Name: ${extras.userName}` : null,
    `Goal: ${GOAL_LABELS[goal]}`,
    `Level: ${LEVEL_LABELS[level]}`,
    extras?.lessonsCompleted !== undefined
      ? `Lessons completed: ${extras.lessonsCompleted}`
      : null,
    extras?.streakDays ? `Study streak: ${extras.streakDays} days` : null,
    extras?.xp !== undefined ? `Total XP: ${extras.xp}` : null,
    extras?.speakingScore !== undefined ? `Speaking score: ${extras.speakingScore}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (completions.length === 0) {
    return `${profileLines}\nNo completed lessons yet — start with foundational interview questions aligned to their goal.`;
  }

  const lessonList = completions
    .map((c) => `- "${c.title}" (score: ${c.score ?? "n/a"}%)`)
    .join("\n");

  const avgScore =
    completions.reduce((sum, c) => sum + (c.score ?? 70), 0) / completions.length;

  const recentTitles = completions
    .slice(0, 5)
    .map((c) => c.title)
    .join(", ");

  return `${profileLines}
Completed ${completions.length} lessons. Average lesson score: ${Math.round(avgScore)}%.
Recent lesson topics: ${recentTitles}

Detailed lesson history:
${lessonList}

IMPORTANT: Reference specific topics and vocabulary from these lessons when asking interview questions.`;
}
