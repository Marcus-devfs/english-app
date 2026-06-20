import { apiSuccess, apiError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { ASSESSMENT_QUESTIONS } from "@/lib/data/assessment-questions";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Não autenticado", 401);

  const questions = ASSESSMENT_QUESTIONS.map(({ correctAnswer, ...q }) => q);
  return apiSuccess({ questions, total: questions.length });
}
