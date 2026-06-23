import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Assessment } from "@/models/Assessment";
import { getSession } from "@/lib/auth/session";
import {
  generateReassessQuestions,
  evaluateReassessAnswers,
} from "@/services/reassess.service";
import { checkAnswer } from "@/lib/data/assessment-questions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { AssessmentQuestion, CEFRLevel, LearningGoal } from "@/types";
import { z } from "zod";

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const lessonsCompleted = user.progress?.lessonsCompleted ?? 0;
    const due = lessonsCompleted > 0 && lessonsCompleted % 20 === 0;

    if (!due) {
      const nextAt = 20 - (lessonsCompleted % 20);
      return apiSuccess({ due: false, lessonsUntilReassess: nextAt });
    }

    const lastAssessment = await Assessment.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? "B1") as CEFRLevel;
    const weaknesses = lastAssessment?.weaknesses ?? [];

    let questions = user.cachedReassess?.questions as AssessmentQuestion[] | undefined;
    if (!questions?.length) {
      questions = await generateReassessQuestions(goal, level, weaknesses);
      await User.findByIdAndUpdate(user._id, { cachedReassess: { questions } });
    }

    const clientQuestions = questions.map(({ correctAnswer: _c, ...q }) => q);

    return apiSuccess({ due: true, questions: clientQuestions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return apiError("Dados inválidos", 400);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const questions = (user.cachedReassess?.questions ?? []) as AssessmentQuestion[];
    if (!questions.length) {
      return apiError("Reavaliação expirada. Recarregue a página.", 400);
    }

    const level = (user.diagnosedLevel ?? "B1") as CEFRLevel;
    const diagnosis = evaluateReassessAnswers(questions, parsed.data.answers, level);

    await Assessment.create({
      userId: session.userId,
      selfAssessedLevel: level,
      diagnosedLevel: diagnosis.level,
      score: diagnosis.score,
      totalQuestions: parsed.data.answers.length,
      answers: parsed.data.answers.map((a) => {
        const q = questions.find((q) => q.id === a.questionId);
        return {
          ...a,
          isCorrect: q ? checkAnswer(q, a.answer) : false,
        };
      }),
      skillBreakdown: diagnosis.skillBreakdown,
      strengths: diagnosis.strengths,
      weaknesses: diagnosis.weaknesses,
      recommendation: `Reavaliação: ${diagnosis.recommendation}`,
    });

    const levelChanged = diagnosis.level !== level;

    await User.findByIdAndUpdate(session.userId, {
      diagnosedLevel: diagnosis.level,
      "progress.currentLevel": diagnosis.level,
      $unset: { cachedReassess: 1 },
    });

    return apiSuccess({
      diagnosedLevel: diagnosis.level,
      previousLevel: level,
      levelChanged,
      score: diagnosis.score,
      skillBreakdown: diagnosis.skillBreakdown,
      strengths: diagnosis.strengths,
      weaknesses: diagnosis.weaknesses,
      recommendation: diagnosis.recommendation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
