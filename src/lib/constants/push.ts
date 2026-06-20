/** Recebe lembretes nos slots automáticos (8h e 19h no fuso do usuário). */
export const REMINDER_ANY_HOUR = -1;

export function isAnyReminderHour(hour: number | undefined | null): boolean {
  return hour === REMINDER_ANY_HOUR;
}

/** Horários padrão para modo "Qualquer horário" (fuso local). */
export const DEFAULT_REMINDER_SLOTS = [8, 19] as const;

/** Slot da tarde/noite para 2º lembrete (horário fixo escolhido de manhã). */
export const EVENING_FALLBACK_HOUR = 19;

/** Não enviar entre 22h e 7h (fuso local). */
export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 7;

/** Máximo de pushes por dia para quem não praticou. */
export const MAX_DAILY_PUSHES = 2;

/** Streak alta → permite 1 push extra (fase futura; reservado). */
export const MAX_DAILY_PUSHES_HIGH_STREAK = 3;
export const HIGH_STREAK_THRESHOLD = 14;

/** Intervalo mínimo entre dois pushes no mesmo dia. */
export const MIN_HOURS_BETWEEN_PUSHES = 4;
