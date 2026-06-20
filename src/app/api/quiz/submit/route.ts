import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { quizSubmitSchema } from "@/lib/validations/auth";
import { QUIZ_QUESTIONS } from "@/lib/data/lessons";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { answers } = parsed.data;

    let correct = 0;
    const results = answers.map((a) => {
      const question = QUIZ_QUESTIONS.find((q) => q.id === a.questionId);
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
    const xpEarned = correct * 10 + (score === 100 ? 50 : 0);

    await connectDB();
    await User.findByIdAndUpdate(session.userId, {
      $inc: {
        "progress.quizzesCompleted": 1,
        "progress.xp": xpEarned,
        "progress.grammarScore": score > 70 ? 2 : 1,
      },
    });

    return apiSuccess({ score, correct, total: answers.length, results, xpEarned });
  } catch (error) {
    return handleApiError(error);
  }
}
