import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { getDailyLesson, getQuizForGoal, GRAMMAR_LESSONS, VOCABULARY_LESSONS } from "@/lib/data/lessons";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? user.selfAssessedLevel ?? "A1") as CEFRLevel;

    const dailyLesson = getDailyLesson(goal, level);
    const quiz = getQuizForGoal(goal, level);

    return apiSuccess({
      dailyLesson,
      quiz,
      grammarLessons: GRAMMAR_LESSONS,
      vocabularyLessons: VOCABULARY_LESSONS,
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
