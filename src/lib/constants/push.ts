/** Recebe lembretes nos slots automáticos (7h, 13h, 17h, 20h e 22h no fuso do usuário). */
export const REMINDER_ANY_HOUR = -1;

export function isAnyReminderHour(hour: number | undefined | null): boolean {
  return hour === REMINDER_ANY_HOUR;
}

/** Manhã no modo "Qualquer horário" (fuso local). */
export const MORNING_REMINDER_HOUR = 7;

/** Slots do dia no modo automático — 1 push por slot, até 5/dia. */
export const DAILY_REMINDER_SLOTS = [7, 13, 17, 20, 22] as const;

/** Início da janela da noite (inclusivo). */
export const EVENING_SLOT_START = 17;

/** Não enviar entre 23h e 7h (fuso local). O slot das 22h fica fora do quiet hours. */
export const QUIET_HOURS_START = 23;
export const QUIET_HOURS_END = 7;

/** Fim da janela da noite (exclusivo — antes do quiet hours). */
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

/** Retorna o slot esperado para o N-ésimo push do dia (0-indexed). */
export function getSlotForSentCount(sentCount: number): number | undefined {
  return DAILY_REMINDER_SLOTS[sentCount];
}

/** Máximo de pushes por dia para quem não praticou. */
export const MAX_DAILY_PUSHES = 5;

/** Streak alta → permite 1 push extra (mesmo limite com 5 slots). */
export const MAX_DAILY_PUSHES_HIGH_STREAK = 5;
export const HIGH_STREAK_THRESHOLD = 14;

/** Intervalo mínimo entre dois pushes no mesmo dia. */
export const MIN_HOURS_BETWEEN_PUSHES = 2;
