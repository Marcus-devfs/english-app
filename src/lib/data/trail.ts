import type { LearningGoal } from "@/types";

export type TrailLessonStatus = "completed" | "current" | "locked";

export interface TrailLesson {
  id: string;
  title: string;
  duration: string;
  xp: number;
  status: TrailLessonStatus;
}

export interface TrailModule {
  id: string;
  title: string;
  goal: LearningGoal;
  lessons: Omit<TrailLesson, "status">[];
}

const TRAIL_MODULES: TrailModule[] = [
  {
    id: "mod1",
    title: "Carreira internacional",
    goal: "career_abroad",
    lessons: [
      { id: "l1", title: "Small talk no trabalho", duration: "5 min", xp: 40 },
      { id: "l2", title: "Describing your role", duration: "5 min", xp: 40 },
      { id: "l3", title: "Talking about impact", duration: "5 min", xp: 40 },
      { id: "l4", title: "Negotiating salary", duration: "8 min", xp: 50 },
      { id: "l5", title: "Leading a standup", duration: "6 min", xp: 45 },
    ],
  },
  {
    id: "mod-tech",
    title: "Carreira em tecnologia",
    goal: "tech_career",
    lessons: [
      { id: "t1", title: "Tech interviews: intro", duration: "5 min", xp: 40 },
      { id: "t2", title: "Describing your stack", duration: "5 min", xp: 40 },
      { id: "t3", title: "Talking about impact", duration: "5 min", xp: 40 },
      { id: "t4", title: "Code review in English", duration: "8 min", xp: 50 },
      { id: "t5", title: "System design basics", duration: "10 min", xp: 55 },
    ],
  },
];

export function getTrailForUser(
  goal: LearningGoal,
  lessonsCompleted: number
): { module: TrailModule; lessons: TrailLesson[] } {
  const module =
    TRAIL_MODULES.find((m) => m.goal === goal) ?? TRAIL_MODULES[0];

  const lessons: TrailLesson[] = module.lessons.map((lesson, index) => {
    let status: TrailLessonStatus = "locked";
    if (index < lessonsCompleted) status = "completed";
    else if (index === lessonsCompleted) status = "current";
    return { ...lesson, status };
  });

  return { module, lessons };
}

export const PHRASE_OF_THE_DAY = {
  phrase: "Let's circle back on this tomorrow.",
  meaning: "Retomar um assunto depois. Comum em reuniões de tech.",
};

export const WEEKLY_GOAL_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
