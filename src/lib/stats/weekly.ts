import { LessonCompletion } from "@/models/LessonCompletion";
import { ChatMessage } from "@/models/ChatMessage";
import { User } from "@/models/User";

function getWeekStart(timezone: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";

  const local = new Date(`${y}-${m}-${d}T00:00:00`);
  const day = local.getDay();
  const diff = day === 0 ? 6 : day - 1;
  local.setDate(local.getDate() - diff);
  return local;
}

function toDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export interface WeeklyStats {
  xpThisWeek: number;
  studyDaysThisWeek: number;
  studyMinutesThisWeek: number;
  lessonsThisWeek: number;
  chatMessagesThisWeek: number;
  quizAccuracy: number | null;
  levelProgressPct: number;
  practiceDaysGoal: number;
  practiceMinutesGoal: number;
}

export async function getWeeklyStats(
  userId: string,
  timezone = "America/Sao_Paulo"
): Promise<WeeklyStats> {
  const weekStart = getWeekStart(timezone);

  const [user, lessons, chatCount, chatDays] = await Promise.all([
    User.findById(userId).lean(),
    LessonCompletion.find({
      userId,
      completedAt: { $gte: weekStart },
      isReview: false,
    }).lean(),
    ChatMessage.countDocuments({
      userId,
      role: "user",
      createdAt: { $gte: weekStart },
    }),
    ChatMessage.distinct("createdAt", {
      userId,
      role: "user",
      createdAt: { $gte: weekStart },
    }),
  ]);

  const uniqueDays = new Set(
    [
      ...lessons.map((l) => toDateKey(new Date(l.completedAt), timezone)),
      ...chatDays.map((d) => toDateKey(new Date(d), timezone)),
    ].filter(Boolean)
  );

  const xpThisWeek =
    lessons.reduce((sum, l) => sum + (l.xpEarned ?? 20), 0) + chatCount * 5;
  const studyMinutesThisWeek =
    lessons.length * 5 + chatCount * 2 + (user?.progress?.totalStudyMinutes ? 0 : 0);

  const lastQuizScore =
    user?.cachedQuiz?.lastScore !== undefined ? user.cachedQuiz.lastScore : null;

  const trailLength = 5;
  const lessonsCompleted = user?.progress?.lessonsCompleted ?? 0;
  const levelProgressPct = Math.min(
    100,
    Math.round((lessonsCompleted / trailLength) * 100)
  );

  return {
    xpThisWeek,
    studyDaysThisWeek: uniqueDays.size,
    studyMinutesThisWeek: Math.max(studyMinutesThisWeek, lessons.length * 5),
    lessonsThisWeek: lessons.length,
    chatMessagesThisWeek: chatCount,
    quizAccuracy: lastQuizScore,
    levelProgressPct,
    practiceDaysGoal: user?.preferences?.practiceDaysPerWeek ?? 5,
    practiceMinutesGoal: user?.preferences?.practiceMinutesPerDay ?? 15,
  };
}

export function daysSinceLastStudy(lastStudyDate?: string): number {
  if (!lastStudyDate) return 999;
  const last = new Date(lastStudyDate + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}
