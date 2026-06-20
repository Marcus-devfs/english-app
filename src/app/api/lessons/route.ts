import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import {
  getDailyLessonForTrail,
  getQuizForGoal,
  getGrammarForGoal,
  getVocabularyForGoal,
} from "@/lib/data/lessons";
import { getTrailForUser } from "@/lib/data/trail";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? user.selfAssessedLevel ?? "A1") as CEFRLevel;
    const lessonsCompleted = user.progress?.lessonsCompleted ?? 0;

    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");
    const trailIndex =
      indexParam !== null
        ? Math.max(0, parseInt(indexParam, 10) || 0)
        : lessonsCompleted;

    const { module, lessons } = getTrailForUser(goal, lessonsCompleted);
    const trailLesson = lessons[trailIndex] ?? lessons[lessonsCompleted] ?? lessons[0];
    const dailyLesson = getDailyLessonForTrail(goal, level, trailIndex);
    const quiz = getQuizForGoal(goal, level);

    return apiSuccess({
      dailyLesson: {
        ...dailyLesson,
        title: trailLesson?.title ?? dailyLesson.title,
      },
      quiz,
      grammarLessons: getGrammarForGoal(goal),
      vocabularyLessons: getVocabularyForGoal(goal),
      trail: {
        index: trailIndex,
        lessonId: trailLesson?.id,
        lessonTitle: trailLesson?.title,
        isReview: trailIndex < lessonsCompleted,
        isCurrent: trailIndex === lessonsCompleted,
        moduleTitle: module.title,
      },
      user: {
        name: user.name,
        goal,
        level,
        progress: user.progress,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
