import type { LearningGoal } from "@/types";
import {
  getTrailForUser,
  type TrailLesson,
  type TrailModule,
} from "@/lib/data/trail";

export function dateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayInTimezone(timezone: string): string {
  return dateInTimezone(new Date(), timezone);
}

export type TrailLessonDisplayStatus =
  | "completed"
  | "completed_today"
  | "current"
  | "locked"
  | "locked_tomorrow";

export interface TrailLessonView extends TrailLesson {
  displayStatus: TrailLessonDisplayStatus;
  canOpen: boolean;
  subtitle: string;
}

export interface TrailDailyState {
  module: TrailModule;
  lessons: TrailLessonView[];
  currentIndex: number;
  lessonsCompleted: number;
  studiedToday: boolean;
  todayLessonIndex: number | null;
  todayLessonDone: boolean;
}

export function getTrailDailyState(
  goal: LearningGoal,
  lessonsCompleted: number,
  lastStudyDate: string | undefined,
  timezone = "America/Sao_Paulo"
): TrailDailyState {
  const today = todayInTimezone(timezone);
  const studiedToday = lastStudyDate === today;
  const { module, lessons, currentIndex } = getTrailForUser(goal, lessonsCompleted);

  const todayLessonIndex =
    lessonsCompleted < module.lessons.length ? lessonsCompleted : null;

  const lessonViews: TrailLessonView[] = lessons.map((lesson, index) => {
    let displayStatus: TrailLessonDisplayStatus;
    let subtitle: string;
    let canOpen = false;
    let status: TrailLesson["status"] = "locked";

    if (index < lessonsCompleted) {
      if (studiedToday && index === lessonsCompleted - 1) {
        displayStatus = "completed_today";
        subtitle = "Feita hoje · revisar quando quiser";
      } else {
        displayStatus = "completed";
        subtitle = "Concluída anteriormente · revisar";
      }
      status = "completed";
      canOpen = true;
    } else if (!studiedToday && index === lessonsCompleted) {
      displayStatus = "current";
      subtitle = `Lição de hoje · ${lesson.duration}`;
      status = "current";
      canOpen = true;
    } else if (studiedToday && index === lessonsCompleted) {
      displayStatus = "locked_tomorrow";
      subtitle = "Próxima lição · disponível amanhã";
      status = "locked";
    } else {
      displayStatus = "locked";
      subtitle = "Complete as lições anteriores";
      status = "locked";
    }

    return { ...lesson, status, displayStatus, subtitle, canOpen };
  });

  return {
    module,
    lessons: lessonViews,
    currentIndex,
    lessonsCompleted,
    studiedToday,
    todayLessonIndex,
    todayLessonDone: lessonViews.some((l) => l.displayStatus === "completed_today"),
  };
}
