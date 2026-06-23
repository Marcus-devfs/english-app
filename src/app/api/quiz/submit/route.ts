import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { quizSubmitSchema } from "@/lib/validations/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { upsertVocabCards } from "@/lib/srs/vocab-cards";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { LearningGoal } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const rateLimit = await checkRateLimit(
      `quiz:${session.userId}`,
      RATE_LIMITS.quizDaily.limit,
      RATE_LIMITS.quizDaily.windowMs
    );
    if (!rateLimit.allowed) {
      return apiError("Limite diário de quizzes atingido. Tente amanhã.", 429);
    }

    const body = await request.json();
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { quizId, answers } = parsed.data;

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const cached = user.cachedQuiz;
    if (!cached?.questions?.length || cached.quizId !== quizId) {
      return apiError("Quiz expirado ou inválido. Recarregue a página.", 400);
    }

    let correct = 0;
    const results = answers.map((a) => {
      const question = cached.questions.find((q) => q.id === a.questionId);
      const isCorrect =
        question?.correctAnswer.toLowerCase() === a.answer.toLowerCase();
      if (isCorrect) correct++;
      return {
        questionId: a.questionId,
        isCorrect,
        explanation: question?.explanation,
        correctAnswer: question?.correctAnswer,
      };
    });

    const score = Math.round((correct / answers.length) * 100);
    const xpPotential = correct * 10 + (score === 100 ? 50 : 0);
    const xpEarned = cached.xpAwarded ? 0 : xpPotential;

    if (!cached.xpAwarded) {
      await User.findByIdAndUpdate(session.userId, {
        $set: {
          "cachedQuiz.completedAt": new Date(),
          "cachedQuiz.xpAwarded": true,
          "cachedQuiz.lastScore": score,
        },
        $inc: {
          "progress.quizzesCompleted": 1,
          "progress.xp": xpEarned,
          "progress.grammarScore": score > 70 ? 2 : 1,
        },
      });
    } else {
      await User.findByIdAndUpdate(session.userId, {
        $set: {
          "cachedQuiz.completedAt": new Date(),
          "cachedQuiz.lastScore": score,
        },
      });
    }

    const wrongWords = results
      .filter((r) => !r.isCorrect && r.correctAnswer)
      .map((r) => ({
        word: r.correctAnswer!.split(" ").slice(0, 3).join(" "),
        meaning: r.explanation ?? r.correctAnswer!,
      }));

    if (wrongWords.length) {
      await upsertVocabCards(
        session.userId,
        (user.goal ?? "conversation") as LearningGoal,
        wrongWords,
        "quiz"
      );
    }

    return apiSuccess({
      score,
      correct,
      total: answers.length,
      results,
      xpEarned,
      alreadyCompleted: cached.xpAwarded,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
