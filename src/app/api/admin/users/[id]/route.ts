import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { NotificationLog } from "@/models/NotificationLog";
import { ChatMessage } from "@/models/ChatMessage";
import { Assessment } from "@/models/Assessment";
import { requireAdmin } from "@/lib/auth/admin";
import { DEFAULT_PREFERENCES } from "@/lib/i18n/translations";
import { serializeSubscription } from "@/lib/subscription";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;

    await connectDB();

    const user = await User.findById(id).lean();
    if (!user) return apiError("Usuário não encontrado", 404);

    const [notificationLogs, chatCount, assessments, recentMessages] =
      await Promise.all([
        NotificationLog.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        ChatMessage.countDocuments({ userId: id }),
        Assessment.find({ userId: id }).sort({ createdAt: -1 }).limit(3).lean(),
        ChatMessage.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("role content createdAt")
          .lean(),
      ]);

    return apiSuccess({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role ?? "user",
        goal: user.goal,
        selfAssessedLevel: user.selfAssessedLevel,
        diagnosedLevel: user.diagnosedLevel,
        onboardingCompleted: user.onboardingCompleted,
        progress: user.progress ?? {},
        preferences: { ...DEFAULT_PREFERENCES, ...user.preferences },
        notificationState: user.notificationState,
        pushDevices: user.pushSubscriptions?.length ?? 0,
        pushSubscriptions: (user.pushSubscriptions ?? []).map((s) => ({
          endpoint: s.endpoint.slice(0, 60) + "...",
          createdAt: s.createdAt,
        })),
        subscription: serializeSubscription(user.subscription),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      activity: {
        chatMessageCount: chatCount,
        recentMessages,
        assessments,
        notificationLogs,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
