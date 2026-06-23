import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { LessonCompletion } from "@/models/LessonCompletion";
import { ChatMessage } from "@/models/ChatMessage";
import { Assessment } from "@/models/Assessment";
import { getSession } from "@/lib/auth/session";
import { getWeeklyStats } from "@/lib/stats/weekly";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user) return apiError("Usuário não encontrado", 404);

    const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
    const weekly = await getWeeklyStats(session.userId, timezone);

    const lastAssessment = await Assessment.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalChatMessages = await ChatMessage.countDocuments({
      userId: session.userId,
      role: "user",
    });

    const reassessDue =
      (user.progress?.lessonsCompleted ?? 0) > 0 &&
      (user.progress?.lessonsCompleted ?? 0) % 20 === 0;

    return apiSuccess({
      user: {
        name: user.name,
        goal: user.goal,
        level: user.diagnosedLevel ?? user.progress?.currentLevel ?? "A1",
        progress: user.progress,
      },
      weekly,
      totalChatMessages,
      lastAssessmentScore: lastAssessment?.score ?? null,
      reassessDue,
      quizCompletedToday: user.cachedQuiz?.xpAwarded ?? false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
