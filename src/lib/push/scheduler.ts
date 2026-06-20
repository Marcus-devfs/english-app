import {
  DAILY_REMINDER_SLOTS,
  HIGH_STREAK_THRESHOLD,
  isAnyReminderHour,
  isEveningReminderSlot,
  MAX_DAILY_PUSHES,
  MAX_DAILY_PUSHES_HIGH_STREAK,
  MIN_HOURS_BETWEEN_PUSHES,
  QUIET_HOURS_END,
  QUIET_HOURS_START,
} from "@/lib/constants/push";
import { getCurrentHourInTimezone } from "@/lib/push/timezone";
import type { NotificationState, ScheduleDecision } from "@/lib/push/types";
import { resolveNotificationType } from "@/lib/push/messages";

export function isQuietHour(hour: number): boolean {
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

export function getMaxDailyPushes(streakDays: number): number {
  return streakDays >= HIGH_STREAK_THRESHOLD
    ? MAX_DAILY_PUSHES_HIGH_STREAK
    : MAX_DAILY_PUSHES;
}

export function getEffectiveSentCount(
  state: NotificationState | undefined,
  today: string
): number {
  if (!state || state.date !== today) return 0;
  return state.sentCount;
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function slotIndex(hour: number): number {
  return DAILY_REMINDER_SLOTS.indexOf(hour as (typeof DAILY_REMINDER_SLOTS)[number]);
}

/** Retorna a hora do slot para o próximo push ou null se fora da janela. */
export function getExpectedSlotHour(
  reminderHour: number,
  sentCount: number,
  currentHour: number
): number | null {
  if (sentCount >= DAILY_REMINDER_SLOTS.length) return null;

  const targetSlot = DAILY_REMINDER_SLOTS[sentCount];

  if (currentHour === targetSlot) return currentHour;

  // Catch-up: perdeu slot anterior — ainda pode receber em slot posterior hoje
  if (currentHour > targetSlot) {
    const currentIdx = slotIndex(currentHour);
    const targetIdx = slotIndex(targetSlot);

    if (currentIdx >= 0 && currentIdx >= targetIdx) {
      return currentHour;
    }

    if (targetSlot >= 19 && isEveningReminderSlot(currentHour)) {
      // 3º push (19h): flexível 19–21h; 4º push (21h): só às 21h
      if (targetSlot === 21 && currentHour !== 21) return null;
      return currentHour;
    }

    if (sentCount === 0 && isEveningReminderSlot(currentHour)) {
      return currentHour;
    }
  }

  return null;
}

export interface EvaluateScheduleInput {
  timezone: string;
  reminderHour: number;
  streakDays: number;
  lastStudyDate?: string;
  notificationState?: NotificationState;
  force?: boolean;
}

export function evaluateReminderSchedule(input: EvaluateScheduleInput): ScheduleDecision {
  const {
    timezone,
    reminderHour,
    streakDays,
    lastStudyDate,
    notificationState,
    force,
  } = input;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (lastStudyDate === today) {
    return { shouldSend: false, reason: "already_studied_today" };
  }

  const currentHour = getCurrentHourInTimezone(timezone);

  if (!force && isQuietHour(currentHour)) {
    return { shouldSend: false, reason: "quiet_hours" };
  }

  const sentCount = getEffectiveSentCount(notificationState, today);
  const maxPushes = getMaxDailyPushes(streakDays);

  if (sentCount >= maxPushes && !force) {
    return { shouldSend: false, reason: "daily_cap_reached" };
  }

  if (
    !force &&
    sentCount > 0 &&
    notificationState?.lastSentAt &&
    hoursSince(new Date(notificationState.lastSentAt)) < MIN_HOURS_BETWEEN_PUSHES
  ) {
    return { shouldSend: false, reason: "cooldown" };
  }

  let expectedSlot: number | null;

  if (isAnyReminderHour(reminderHour)) {
    expectedSlot = getExpectedSlotHour(reminderHour, sentCount, currentHour);
  } else if (sentCount === 0) {
    expectedSlot = currentHour === reminderHour ? reminderHour : null;
  } else if (reminderHour >= 19) {
    expectedSlot = null;
  } else {
    expectedSlot = getExpectedSlotHour(reminderHour, sentCount, currentHour);
  }

  if (!force && expectedSlot === null) {
    return { shouldSend: false, reason: "no_slot_for_count" };
  }

  if (!force && expectedSlot !== currentHour) {
    return { shouldSend: false, reason: "wrong_slot" };
  }

  const type = resolveNotificationType(sentCount, streakDays);

  return {
    shouldSend: true,
    reason: force ? "forced" : "scheduled",
    type,
    slotHour: expectedSlot ?? currentHour,
  };
}
