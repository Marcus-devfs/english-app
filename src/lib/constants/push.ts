/** Recebe lembrete sempre que o cron rodar (1×/hora), se ainda não praticou no dia. */
export const REMINDER_ANY_HOUR = -1;

export function isAnyReminderHour(hour: number | undefined | null): boolean {
  return hour === REMINDER_ANY_HOUR;
}
