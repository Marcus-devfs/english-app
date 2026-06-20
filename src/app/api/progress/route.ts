import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const { type } = body as { type: "lesson" | "study" };

    await connectDB();

    const updates: Record<string, unknown> = {
      $inc: {
        "progress.xp": type === "lesson" ? 20 : 5,
        "progress.totalStudyMinutes": type === "study" ? 10 : 5,
      },
    };

    if (type === "lesson") {
      (updates.$inc as Record<string, number>)["progress.lessonsCompleted"] = 1;
      (updates.$inc as Record<string, number>)["progress.vocabularyScore"] = 2;
    }

    const user = await User.findByIdAndUpdate(session.userId, updates, { new: true });
    if (!user) return apiError("Usuário não encontrado", 404);

    const today = new Date().toISOString().split("T")[0];
    if (user.progress.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const newStreak =
        user.progress.lastStudyDate === yesterdayStr
          ? user.progress.streakDays + 1
          : 1;

      await User.findByIdAndUpdate(session.userId, {
        "progress.streakDays": newStreak,
        "progress.lastStudyDate": today,
      });

      user.progress.streakDays = newStreak;
    }

    return apiSuccess({ progress: user.progress });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const notifications = [];

    if (user.progress.streakDays >= 3) {
      notifications.push({
        id: "streak",
        type: "streak",
        title: `🔥 ${user.progress.streakDays} dias seguidos!`,
        message: "Continue assim! Consistência é a chave para fluência.",
        read: false,
      });
    }

    if (user.progress.xp >= 100 && user.progress.xp < 120) {
      notifications.push({
        id: "xp100",
        type: "achievement",
        title: "🏆 100 XP alcançados!",
        message: "Você está progredindo muito bem. Continue praticando!",
        read: false,
      });
    }

    notifications.push({
      id: "daily-tip",
      type: "tip",
      title: "💡 Dica do dia",
      message: "Pratique 15 minutos por dia. Pequenas sessões consistentes vencem maratonas esporádicas.",
      read: false,
    });

    if (user.progress.lessonsCompleted === 0) {
      notifications.push({
        id: "first-lesson",
        type: "reminder",
        title: "📚 Sua primeira lição te espera!",
        message: "Complete a lição do dia para começar a ganhar XP.",
        read: false,
      });
    }

    return apiSuccess({ progress: user.progress, notifications });
  } catch (error) {
    return handleApiError(error);
  }
}
