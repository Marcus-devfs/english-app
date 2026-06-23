import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { LessonCompletion } from "@/models/LessonCompletion";
import { getSession } from "@/lib/auth/session";
import { progressUpdateSchema } from "@/lib/validations/progress";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";
import { todayInTimezone, dateInTimezone } from "@/lib/trail/daily";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const rate = await checkRateLimit(
      `progress:${session.userId}`,
      RATE_LIMITS.progressHourly.limit,
      RATE_LIMITS.progressHourly.windowMs
    );
    if (!rate.allowed) return rateLimitExceededResponse(rate);

    const body = await request.json();
    const parsed = progressUpdateSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { type, lessonId, trailIndex, title, goal, level, score, stepsCompleted, isReview } =
      parsed.data;

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    if (type === "lesson" && lessonId && !isReview) {
      const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
      const today = todayInTimezone(timezone);

      if (user.progress.lastStudyDate === today) {
        const latest = await LessonCompletion.findOne({
          userId: session.userId,
          isReview: false,
        }).sort({ completedAt: -1 });

        if (
          latest &&
          dateInTimezone(new Date(latest.completedAt), timezone) === today
        ) {
          return apiError(
            "Você já completou a lição de hoje. Revise lições anteriores ou volte amanhã.",
            400
          );
        }
      }

      const existing = await LessonCompletion.findOne({
        userId: session.userId,
        lessonId,
      });

      if (existing) {
        return apiSuccess({
          progress: user.progress,
          alreadyCompleted: true,
        });
      }

      await LessonCompletion.create({
        userId: session.userId,
        lessonId,
        trailIndex: trailIndex ?? user.progress.lessonsCompleted,
        goal: (goal ?? user.goal ?? "conversation") as LearningGoal,
        title: title ?? lessonId,
        level: (level ?? user.diagnosedLevel ?? "A1") as CEFRLevel,
        score,
        stepsCompleted: stepsCompleted ?? [],
        xpEarned: 20,
        isReview: false,
      });

      const updates: Record<string, unknown> = {
        $inc: {
          "progress.xp": 20,
          "progress.totalStudyMinutes": 5,
          "progress.lessonsCompleted": 1,
          "progress.vocabularyScore": 2,
        },
      };

      const updatedUser = await User.findByIdAndUpdate(session.userId, updates, { new: true });
      if (!updatedUser) return apiError("Usuário não encontrado", 404);

      await updateStreak(session.userId, updatedUser);

      const freshUser = await User.findById(session.userId);
      return apiSuccess({ progress: freshUser?.progress ?? updatedUser.progress });
    }

    if (type === "lesson" && isReview && lessonId) {
      await LessonCompletion.findOneAndUpdate(
        { userId: session.userId, lessonId },
        {
          $setOnInsert: {
            userId: session.userId,
            lessonId,
            trailIndex: trailIndex ?? 0,
            goal: (goal ?? user.goal ?? "conversation") as LearningGoal,
            title: title ?? lessonId,
            level: (level ?? user.diagnosedLevel ?? "A1") as CEFRLevel,
            score,
            stepsCompleted: stepsCompleted ?? [],
            xpEarned: 0,
            isReview: true,
            completedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return apiSuccess({ progress: user.progress, reviewRecorded: true });
    }

    if (type === "study") {
      const updatedUser = await User.findByIdAndUpdate(
        session.userId,
        { $inc: { "progress.xp": 5, "progress.totalStudyMinutes": 10 } },
        { new: true }
      );
      if (!updatedUser) return apiError("Usuário não encontrado", 404);
      await updateStreak(session.userId, updatedUser);
      const freshUser = await User.findById(session.userId);
      return apiSuccess({ progress: freshUser?.progress ?? updatedUser.progress });
    }

    return apiError("Requisição inválida. Informe lessonId para completar lições.", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

async function updateStreak(userId: string, user: InstanceType<typeof User>) {
  const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimezone(timezone);

  if (user.progress.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = dateInTimezone(yesterday, timezone);

    const newStreak =
      user.progress.lastStudyDate === yesterdayStr ? user.progress.streakDays + 1 : 1;

    await User.findByIdAndUpdate(userId, {
      "progress.streakDays": newStreak,
      "progress.lastStudyDate": today,
    });
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
