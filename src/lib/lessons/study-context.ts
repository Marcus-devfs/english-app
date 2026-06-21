import type { LearningGoal, CEFRLevel } from "@/types";
import { LessonCompletion } from "@/models/LessonCompletion";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";

export async function buildStudyContext(
  userId: string,
  goal: LearningGoal,
  level: CEFRLevel
): Promise<string> {
  const completions = await LessonCompletion.find({ userId, isReview: false })
    .sort({ completedAt: -1 })
    .limit(12)
    .lean();

  if (completions.length === 0) {
    return `Student goal: ${GOAL_LABELS[goal]}. Level: ${LEVEL_LABELS[level]}. No completed lessons yet — start with foundational questions.`;
  }

  const lessonList = completions
    .map((c) => `- "${c.title}" (lesson ${c.lessonId}, score: ${c.score ?? "n/a"}%)`)
    .join("\n");

  const avgScore =
    completions.reduce((sum, c) => sum + (c.score ?? 70), 0) / completions.length;

  return `Student goal: ${GOAL_LABELS[goal]}. Level: ${LEVEL_LABELS[level]}.
Completed ${completions.length} lessons. Average score: ${Math.round(avgScore)}%.
Recent lessons:
${lessonList}
Use vocabulary and scenarios from these lessons when relevant.`;
}
