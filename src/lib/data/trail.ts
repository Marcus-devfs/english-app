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
    id: "mod-career",
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
  {
    id: "mod-travel",
    title: "Inglês para viagens",
    goal: "travel",
    lessons: [
      { id: "tr1", title: "No aeroporto", duration: "5 min", xp: 40 },
      { id: "tr2", title: "Hotel check-in", duration: "5 min", xp: 40 },
      { id: "tr3", title: "Pedindo direções", duration: "5 min", xp: 40 },
      { id: "tr4", title: "No restaurante", duration: "6 min", xp: 45 },
      { id: "tr5", title: "Imprevistos na viagem", duration: "8 min", xp: 50 },
    ],
  },
  {
    id: "mod-business",
    title: "Inglês para negócios",
    goal: "business",
    lessons: [
      { id: "b1", title: "Emails profissionais", duration: "5 min", xp: 40 },
      { id: "b2", title: "Reuniões virtuais", duration: "5 min", xp: 40 },
      { id: "b3", title: "Apresentando ideias", duration: "6 min", xp: 45 },
      { id: "b4", title: "Negociação", duration: "8 min", xp: 50 },
      { id: "b5", title: "Feedback ao time", duration: "6 min", xp: 45 },
    ],
  },
  {
    id: "mod-academic",
    title: "Inglês acadêmico",
    goal: "academic",
    lessons: [
      { id: "a1", title: "Apresentações em sala", duration: "5 min", xp: 40 },
      { id: "a2", title: "Debates e argumentos", duration: "6 min", xp: 45 },
      { id: "a3", title: "Leitura de artigos", duration: "8 min", xp: 50 },
      { id: "a4", title: "Escrevendo abstracts", duration: "8 min", xp: 50 },
      { id: "a5", title: "Entrevistas acadêmicas", duration: "6 min", xp: 45 },
    ],
  },
  {
    id: "mod-conversation",
    title: "Conversação fluente",
    goal: "conversation",
    lessons: [
      { id: "c1", title: "Cumprimentos naturais", duration: "5 min", xp: 40 },
      { id: "c2", title: "Contando seu dia", duration: "5 min", xp: 40 },
      { id: "c3", title: "Opiniões e preferências", duration: "6 min", xp: 45 },
      { id: "c4", title: "Convites e planos", duration: "6 min", xp: 45 },
      { id: "c5", title: "Conversas mais longas", duration: "8 min", xp: 50 },
    ],
  },
];

export function getTrailForUser(
  goal: LearningGoal,
  lessonsCompleted: number
): { module: TrailModule; lessons: TrailLesson[]; currentIndex: number } {
  const module =
    TRAIL_MODULES.find((m) => m.goal === goal) ?? TRAIL_MODULES[0];

  const currentIndex = Math.min(lessonsCompleted, module.lessons.length - 1);

  const lessons: TrailLesson[] = module.lessons.map((lesson, index) => {
    let status: TrailLessonStatus = "locked";
    if (index < lessonsCompleted) status = "completed";
    else if (index === lessonsCompleted) status = "current";
    return { ...lesson, status };
  });

  return { module, lessons, currentIndex };
}

export function getTodayLabel(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const PHRASE_OF_THE_DAY = {
  phrase: "Let's circle back on this tomorrow.",
  meaning: "Retomar um assunto depois. Comum em reuniões de tech.",
};

export const WEEKLY_GOAL_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
