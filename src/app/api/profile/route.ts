import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validations/profile";
import { GOAL_LABELS, LEVEL_LABELS } from "@/types";
import type { LearningGoal, CEFRLevel } from "@/types";
import {
  apiSuccess,
  apiError,
  handleZodError,
  handleApiError,
} from "@/lib/api/response";

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    goal: user.goal,
    selfAssessedLevel: user.selfAssessedLevel,
    diagnosedLevel: user.diagnosedLevel,
    onboardingCompleted: user.onboardingCompleted,
    progress: user.progress,
    preferences: user.preferences,
    goalLabel: user.goal
      ? GOAL_LABELS[user.goal as LearningGoal]
      : undefined,
    levelLabel: user.diagnosedLevel
      ? LEVEL_LABELS[user.diagnosedLevel as CEFRLevel]
      : undefined,
    hasPushSubscription: (user.pushSubscriptions?.length ?? 0) > 0,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    return apiSuccess({ user: serializeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    await connectDB();

    const updates: Record<string, unknown> = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.goal) updates.goal = parsed.data.goal;

    if (parsed.data.preferences) {
      for (const [key, value] of Object.entries(parsed.data.preferences)) {
        updates[`preferences.${key}`] = value;
      }
    }

    const user = await User.findByIdAndUpdate(session.userId, updates, {
      new: true,
    });

    if (!user) return apiError("Usuário não encontrado", 404);

    return apiSuccess({ user: serializeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
