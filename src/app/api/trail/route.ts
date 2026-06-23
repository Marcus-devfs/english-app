import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { getTrailDailyState } from "@/lib/trail/daily";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
    const trail = getTrailDailyState(
      (user.goal ?? "conversation") as LearningGoal,
      user.progress?.lessonsCompleted ?? 0,
      user.progress?.lastStudyDate,
      timezone
    );

    return apiSuccess({
      trail,
      user: {
        goal: user.goal,
        level: user.diagnosedLevel ?? user.selfAssessedLevel ?? "A1",
        progress: user.progress,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
