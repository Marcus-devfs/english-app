import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { LessonCompletion } from "@/models/LessonCompletion";
import { ChatMessage } from "@/models/ChatMessage";
import { VocabCard } from "@/models/VocabCard";
import { Assessment } from "@/models/Assessment";
import { getSession } from "@/lib/auth/session";
import { getWeeklyStats } from "@/lib/stats/weekly";
import { GOAL_LABELS } from "@/types";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user) return apiError("Usuário não encontrado", 404);

    const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
    const weekly = await getWeeklyStats(session.userId, timezone);

    const recentLessons = await LessonCompletion.find({
      userId: session.userId,
      isReview: false,
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    const vocabReviewed = await VocabCard.countDocuments({
      userId: session.userId,
      repetitions: { $gt: 0 },
    });

    const lastAssessment = await Assessment.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    const goal = (user.goal ?? "conversation") as LearningGoal;

    const highlights: string[] = [];
    if (weekly.lessonsThisWeek > 0) {
      highlights.push(`Você completou ${weekly.lessonsThisWeek} lição(ões) esta semana.`);
    }
    if (weekly.chatMessagesThisWeek > 0) {
      highlights.push(`Praticou ${weekly.chatMessagesThisWeek} mensagens no chat com a IA.`);
    }
    if ((user.progress?.streakDays ?? 0) >= 3) {
      highlights.push(
        `Manteve uma streak de ${user.progress?.streakDays} dias — excelente consistência!`
      );
    }
    if (weekly.quizAccuracy !== null) {
      highlights.push(`Seu último quiz teve ${weekly.quizAccuracy}% de acerto.`);
    }
    if (highlights.length === 0) {
      highlights.push("Esta semana está começando — que tal uma lição de 5 minutos hoje?");
    }

    const focusAreas: string[] = [];
    if (lastAssessment?.weaknesses?.length) {
      focusAreas.push(...lastAssessment.weaknesses.slice(0, 3));
    } else {
      focusAreas.push("Conversação", "Vocabulário do seu objetivo");
    }

    return apiSuccess({
      weekLabel: new Date().toLocaleDateString("pt-BR", {
        timeZone: timezone,
        day: "numeric",
        month: "long",
      }),
      goal: GOAL_LABELS[goal],
      level: user.diagnosedLevel ?? user.progress?.currentLevel ?? "A1",
      weekly,
      streakDays: user.progress?.streakDays ?? 0,
      totalXp: user.progress?.xp ?? 0,
      lessonsCompleted: user.progress?.lessonsCompleted ?? 0,
      recentLessons: recentLessons.map((l) => ({
        title: l.title,
        score: l.score,
        completedAt: l.completedAt,
      })),
      vocabCardsReviewed: vocabReviewed,
      highlights,
      focusAreas,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
