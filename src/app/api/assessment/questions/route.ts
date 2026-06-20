import { apiSuccess } from "@/lib/api/response";
import { ASSESSMENT_QUESTIONS } from "@/lib/data/assessment-questions";

export async function GET() {
  const questions = ASSESSMENT_QUESTIONS.map(({ correctAnswer, ...q }) => q);
  return apiSuccess({ questions, total: questions.length });
}
