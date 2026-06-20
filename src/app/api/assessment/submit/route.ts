import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Assessment } from "@/models/Assessment";
import { getSession } from "@/lib/auth/session";
import { assessmentSubmitSchema } from "@/lib/validations/auth";
import {
  ASSESSMENT_QUESTIONS,
  checkAnswer,
  diagnoseLevel,
} from "@/lib/data/assessment-questions";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { CEFRLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = assessmentSubmitSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { answers, selfAssessedLevel } = parsed.data;

    const evaluatedAnswers = answers.map((a) => {
      const question = ASSESSMENT_QUESTIONS.find((q) => q.id === a.questionId);
      const isCorrect = question ? checkAnswer(question, a.answer) : false;
      return {
        questionId: a.questionId,
        answer: a.answer,
        isCorrect,
        timeSpentMs: a.timeSpentMs,
      };
    });

    const diagnosis = diagnoseLevel(evaluatedAnswers, selfAssessedLevel as CEFRLevel);

    await connectDB();

    await Assessment.create({
      userId: session.userId,
      selfAssessedLevel,
      diagnosedLevel: diagnosis.level,
      score: diagnosis.score,
      totalQuestions: answers.length,
      answers: evaluatedAnswers,
      skillBreakdown: diagnosis.skillBreakdown,
      strengths: diagnosis.strengths,
      weaknesses: diagnosis.weaknesses,
      recommendation: diagnosis.recommendation,
    });

    await User.findByIdAndUpdate(session.userId, {
      diagnosedLevel: diagnosis.level,
      "progress.currentLevel": diagnosis.level,
      onboardingCompleted: true,
    });

    return apiSuccess({
      selfAssessedLevel,
      diagnosedLevel: diagnosis.level,
      score: diagnosis.score,
      totalQuestions: answers.length,
      skillBreakdown: diagnosis.skillBreakdown,
      strengths: diagnosis.strengths,
      weaknesses: diagnosis.weaknesses,
      recommendation: diagnosis.recommendation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
