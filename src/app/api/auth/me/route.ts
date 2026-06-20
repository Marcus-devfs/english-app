import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { isAdminUser, syncAdminRole } from "@/lib/auth/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    await syncAdminRole(user);

    return apiSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        selfAssessedLevel: user.selfAssessedLevel,
        diagnosedLevel: user.diagnosedLevel,
        onboardingCompleted: user.onboardingCompleted,
        progress: user.progress,
        preferences: user.preferences,
        isAdmin: isAdminUser(user),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
