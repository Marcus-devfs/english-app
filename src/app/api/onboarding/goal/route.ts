import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { onboardingGoalSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = onboardingGoalSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.userId,
      {
        goal: parsed.data.goal,
        selfAssessedLevel: parsed.data.selfAssessedLevel,
        "progress.targetLevel": parsed.data.selfAssessedLevel,
      },
      { new: true }
    );

    if (!user) return apiError("Usuário não encontrado", 404);

    return apiSuccess({ goal: user.goal, selfAssessedLevel: user.selfAssessedLevel });
  } catch (error) {
    return handleApiError(error);
  }
}
