import type { LearningGoal } from "@/types";
import type { PushMessageContext, PushNotificationType } from "@/lib/push/types";

type MessageTemplate = { title: string; body: string };

type GoalMessages = Record<
  PushNotificationType,
  Record<"pt" | "en", MessageTemplate>
>;

const DEFAULT_GOAL: LearningGoal = "conversation";

function tpl(title: string, body: string): MessageTemplate {
  return { title, body };
}

const GOAL_MESSAGES: Record<LearningGoal, GoalMessages> = {
  tech_career: {
    daily_invite: {
      pt: tpl(
        "Norte · Tech em inglês",
        "Oi {firstName}! {minutes} min de vocabulário tech hoje — stand-ups, PRs e entrevistas."
      ),
      en: tpl(
        "Norte · Tech English",
        "Hi {firstName}! {minutes} min of tech vocabulary today — stand-ups, PRs, and interviews."
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Ainda dá tempo",
        "Uma lição rápida na trilha mantém seu inglês afiado para o mercado internacional."
      ),
      en: tpl(
        "Norte · Still time",
        "A quick trail lesson keeps your English sharp for the global market."
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · Streak em risco 🔥",
        "{firstName}, {streak} dias seguidos! Não perca o ritmo antes da próxima entrevista."
      ),
      en: tpl(
        "Norte · Streak at risk 🔥",
        "{firstName}, {streak} days in a row! Don't lose momentum before your next interview."
      ),
    },
  },
  career_abroad: {
    daily_invite: {
      pt: tpl(
        "Norte · Carreira global",
        "Bom dia, {firstName}! {minutes} min hoje te aproximam de oportunidades no exterior."
      ),
      en: tpl(
        "Norte · Global career",
        "Good morning, {firstName}! {minutes} min today bring you closer to opportunities abroad."
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Consistência vence",
        "Profissionais que praticam todo dia chegam primeiro. Bora fazer uma lição?"
      ),
      en: tpl(
        "Norte · Consistency wins",
        "Professionals who practice daily get there first. Ready for a lesson?"
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · {streak} dias de streak",
        "Sua ofensiva termina à meia-noite. {minutes} min salvam o dia, {firstName}!"
      ),
      en: tpl(
        "Norte · {streak}-day streak",
        "Your streak ends at midnight. {minutes} min can save the day, {firstName}!"
      ),
    },
  },
  business: {
    daily_invite: {
      pt: tpl(
        "Norte · Inglês para negócios",
        "{firstName}, emails, calls e reuniões — {minutes} min de prática hoje?"
      ),
      en: tpl(
        "Norte · Business English",
        "{firstName}, emails, calls, and meetings — {minutes} min of practice today?"
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Reunião em inglês?",
        "Revise frases de negociação e apresentação em uma lição de 5 min."
      ),
      en: tpl(
        "Norte · English meeting?",
        "Review negotiation and presentation phrases in a 5-min lesson."
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · Não quebre a sequência",
        "{streak} dias seguidos, {firstName}. Líderes são consistentes — pratique agora."
      ),
      en: tpl(
        "Norte · Keep the streak",
        "{streak} days in a row, {firstName}. Leaders stay consistent — practice now."
      ),
    },
  },
  travel: {
    daily_invite: {
      pt: tpl(
        "Norte · Inglês para viagem ✈️",
        "Oi {firstName}! {minutes} min de frases úteis — aeroporto, hotel, restaurante."
      ),
      en: tpl(
        "Norte · Travel English ✈️",
        "Hi {firstName}! {minutes} min of useful phrases — airport, hotel, restaurant."
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Pratique antes de voar",
        "Vocabulário de viagem na palma da mão. Uma lição rápida no vocab?"
      ),
      en: tpl(
        "Norte · Practice before you fly",
        "Travel vocabulary at your fingertips. A quick vocab lesson?"
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · Sua streak viaja com você",
        "{streak} dias! Não deixe o hábito para trás — {minutes} min e pronto."
      ),
      en: tpl(
        "Norte · Your streak travels with you",
        "{streak} days! Don't leave the habit behind — {minutes} min and you're done."
      ),
    },
  },
  academic: {
    daily_invite: {
      pt: tpl(
        "Norte · Inglês acadêmico",
        "{firstName}, {minutes} min de reading e vocabulário acadêmico hoje?"
      ),
      en: tpl(
        "Norte · Academic English",
        "{firstName}, {minutes} min of academic reading and vocabulary today?"
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Artigos e papers",
        "Fortaleça reading e vocabulário formal com uma lição curta na trilha."
      ),
      en: tpl(
        "Norte · Papers and articles",
        "Strengthen formal reading and vocabulary with a short trail lesson."
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · Disciplina diária",
        "{streak} dias de streak, {firstName}. Estudantes consistentes aprendem mais rápido."
      ),
      en: tpl(
        "Norte · Daily discipline",
        "{streak}-day streak, {firstName}. Consistent students learn faster."
      ),
    },
  },
  conversation: {
    daily_invite: {
      pt: tpl(
        "Norte · Hora de falar!",
        "Oi {firstName}! {minutes} min com o professor IA — texto ou voz."
      ),
      en: tpl(
        "Norte · Time to speak!",
        "Hi {firstName}! {minutes} min with your AI teacher — text or voice."
      ),
    },
    gentle_nudge: {
      pt: tpl(
        "Norte · Fluência vem na prática",
        "5 min de conversa no chat fazem diferença. Bora?"
      ),
      en: tpl(
        "Norte · Fluency comes with practice",
        "5 min of chat conversation makes a difference. Let's go?"
      ),
    },
    streak_risk: {
      pt: tpl(
        "Norte · {streak} dias falando inglês 🔥",
        "Última chance hoje, {firstName}! Uma conversa rápida salva sua streak."
      ),
      en: tpl(
        "Norte · {streak} days speaking English 🔥",
        "Last chance today, {firstName}! A quick chat saves your streak."
      ),
    },
  },
};

const GOAL_DEEP_LINKS: Record<LearningGoal, string> = {
  tech_career: "/trilha",
  career_abroad: "/trilha",
  business: "/trilha",
  travel: "/vocabulary",
  academic: "/trilha",
  conversation: "/chat",
};

export function getDeepLinkForGoal(goal?: LearningGoal): string {
  return GOAL_DEEP_LINKS[goal ?? DEFAULT_GOAL];
}

export function getMessageTemplate(ctx: PushMessageContext): MessageTemplate {
  const goal = ctx.goal ?? DEFAULT_GOAL;
  const messages = GOAL_MESSAGES[goal] ?? GOAL_MESSAGES[DEFAULT_GOAL];
  return messages[ctx.type][ctx.language];
}

export function interpolateTemplate(
  template: MessageTemplate,
  vars: Record<string, string | number>
): MessageTemplate {
  const replace = (text: string) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));

  return {
    title: replace(template.title),
    body: replace(template.body),
  };
}

export function resolveNotificationType(
  sentCount: number,
  streakDays: number
): PushNotificationType {
  if (sentCount === 0) return "daily_invite";
  if (streakDays >= 3) return "streak_risk";
  return "gentle_nudge";
}
