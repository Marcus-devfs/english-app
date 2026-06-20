/** Recebe lembretes nos slots automáticos (8h, 12h, 19h e 21h no fuso do usuário). */
export const REMINDER_ANY_HOUR = -1;

export function isAnyReminderHour(hour: number | undefined | null): boolean {
  return hour === REMINDER_ANY_HOUR;
}

/** Manhã no modo "Qualquer horário" (fuso local). */
export const MORNING_REMINDER_HOUR = 8;

/** Slots do dia no modo automático — 1 push por slot, até 4/dia. */
export const DAILY_REMINDER_SLOTS = [8, 12, 19, 21] as const;

/** Início da janela da noite (inclusivo). */
export const EVENING_SLOT_START = 19;

/** Não enviar entre 22h e 7h (fuso local). */
export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 7;

/** Fim da janela da noite (exclusivo — coincide com quiet hours). */
export const EVENING_SLOT_END = QUIET_HOURS_START;

export function isMorningReminderSlot(hour: number): boolean {
  return hour === MORNING_REMINDER_HOUR;
}

export function isEveningReminderSlot(hour: number): boolean {
  return hour >= EVENING_SLOT_START && hour < EVENING_SLOT_END;
}

export function isDefaultReminderSlot(hour: number): boolean {
  return (DAILY_REMINDER_SLOTS as readonly number[]).includes(hour);
}

/** Máximo de pushes por dia para quem não praticou. */
export const MAX_DAILY_PUSHES = 4;

/** Streak alta → permite 1 push extra. */
export const MAX_DAILY_PUSHES_HIGH_STREAK = 5;
export const HIGH_STREAK_THRESHOLD = 14;

/** Intervalo mínimo entre dois pushes no mesmo dia (19h→21h = 2h). */
export const MIN_HOURS_BETWEEN_PUSHES = 2;
