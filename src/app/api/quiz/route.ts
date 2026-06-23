import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { generateQuiz, stripCorrectAnswers } from "@/services/quiz.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? user.selfAssessedLevel ?? "A1") as CEFRLevel;
    const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
    const today = todayInTimezone(timezone);

    let questions = user.cachedQuiz?.questions;
    let quizId = user.cachedQuiz?.quizId;
    let source: "ai" | "static" | "cached" = "cached";

    if (!questions?.length || quizId !== today) {
      const generated = await generateQuiz(goal, level);
      questions = generated.questions;
      quizId = today;
      source = generated.source;

      await User.findByIdAndUpdate(user._id, {
        cachedQuiz: {
          quizId: today,
          questions,
          xpAwarded: false,
        },
      });
    }

    const alreadyCompleted = user.cachedQuiz?.quizId === today && user.cachedQuiz?.xpAwarded;

    return apiSuccess({
      quizId,
      questions: stripCorrectAnswers(questions),
      total: questions.length,
      alreadyCompleted,
      source,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
