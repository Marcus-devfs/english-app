import { connectDB } from "@/lib/db/mongodb";
import { LessonCompletion } from "@/models/LessonCompletion";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();

    const completions = await LessonCompletion.find({ userId: session.userId })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    return apiSuccess({
      completions: completions.map((c) => ({
        id: c._id.toString(),
        lessonId: c.lessonId,
        trailIndex: c.trailIndex,
        goal: c.goal,
        title: c.title,
        level: c.level,
        score: c.score,
        stepsCompleted: c.stepsCompleted,
        xpEarned: c.xpEarned,
        isReview: c.isReview,
        completedAt: c.completedAt,
      })),
      total: completions.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
