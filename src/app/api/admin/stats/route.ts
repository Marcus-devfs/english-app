import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { NotificationLog } from "@/models/NotificationLog";
import { ChatMessage } from "@/models/ChatMessage";
import { Assessment } from "@/models/Assessment";
import { requireAdmin } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api/response";

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    await connectDB();

    const today = todayLocalDate();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      onboardedUsers,
      activeToday,
      pushStats,
      totalChatMessages,
      totalAssessments,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ onboardingCompleted: true }),
      User.countDocuments({ "progress.lastStudyDate": today }),
      NotificationLog.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      ChatMessage.countDocuments(),
      Assessment.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt onboardingCompleted progress.streakDays progress.xp")
        .lean(),
    ]);

    const pushSent = pushStats.find((s) => s._id === "sent")?.count ?? 0;
    const pushFailed = pushStats.find((s) => s._id === "failed")?.count ?? 0;

    const streakAgg = await User.aggregate<{ avgStreak: number }>([
      { $group: { _id: null, avgStreak: { $avg: "$progress.streakDays" } } },
    ]);

    return apiSuccess({
      stats: {
        totalUsers,
        onboardedUsers,
        activeToday,
        pushSentWeek: pushSent,
        pushFailedWeek: pushFailed,
        totalChatMessages,
        totalAssessments,
        avgStreakDays: Math.round(streakAgg[0]?.avgStreak ?? 0),
      },
      recentUsers: recentUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        onboardingCompleted: u.onboardingCompleted,
        streakDays: u.progress?.streakDays ?? 0,
        xp: u.progress?.xp ?? 0,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
