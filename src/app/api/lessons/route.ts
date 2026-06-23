import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getTrailForUser } from "@/lib/data/trail";
import { getTrailDailyState } from "@/lib/trail/daily";
import { generateDailyLesson } from "@/services/lesson.service";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? user.selfAssessedLevel ?? "A1") as CEFRLevel;
    const lessonsCompleted = user.progress?.lessonsCompleted ?? 0;
    const timezone = user.preferences?.timezone ?? "America/Sao_Paulo";
    const today = todayInTimezone(timezone);

    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");
    const trailIndex =
      indexParam !== null
        ? Math.max(0, parseInt(indexParam, 10) || 0)
        : lessonsCompleted;

    const { module, lessons } = getTrailForUser(goal, lessonsCompleted);
    const trailState = getTrailDailyState(
      goal,
      lessonsCompleted,
      user.progress?.lastStudyDate,
      timezone
    );
    const trailLesson = lessons[trailIndex] ?? lessons[lessonsCompleted] ?? lessons[0];
    const lessonView = trailState.lessons[trailIndex];
    const lessonCacheKey = `${today}-t${trailIndex}`;

    let dailyLesson = user.cachedLesson?.lesson;
    let lessonSource: "ai" | "static" | "cached" = "cached";

    if (
      !dailyLesson ||
      user.cachedLesson?.lessonId !== lessonCacheKey ||
      user.cachedLesson?.trailIndex !== trailIndex
    ) {
      const generated = await generateDailyLesson(
        goal,
        level,
        trailIndex,
        trailLesson?.title ?? "Lição do dia"
      );
      dailyLesson = generated.lesson;
      lessonSource = generated.source;

      await User.findByIdAndUpdate(user._id, {
        cachedLesson: {
          lessonId: lessonCacheKey,
          trailIndex,
          lesson: dailyLesson,
          source: generated.source,
        },
      });
    }

    return apiSuccess({
      dailyLesson: {
        ...dailyLesson,
        title: trailLesson?.title ?? dailyLesson.title,
      },
      lessonSource,
      grammarLessons: (await import("@/lib/data/lessons")).getGrammarForGoal(goal),
      vocabularyLessons: (await import("@/lib/data/lessons")).getVocabularyForGoal(goal),
      trail: {
        index: trailIndex,
        lessonId: trailLesson?.id,
        lessonTitle: trailLesson?.title,
        isReview: trailIndex < lessonsCompleted,
        isCurrent: lessonView?.displayStatus === "current",
        isTodayDone: lessonView?.displayStatus === "completed_today",
        moduleTitle: module.title,
      },
      user: {
        name: user.name,
        goal,
        level,
        progress: user.progress,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
