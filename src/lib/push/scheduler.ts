import {
  HIGH_STREAK_THRESHOLD,
  isAnyReminderHour,
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

  // Horário personalizado: primeiro push só após a hora escolhida (fuso local)
  if (
    !force &&
    !isAnyReminderHour(reminderHour) &&
    sentCount === 0 &&
    currentHour < reminderHour
  ) {
    return { shouldSend: false, reason: "before_reminder_hour" };
  }

  const type = resolveNotificationType(sentCount, streakDays);

  return {
    shouldSend: true,
    reason: force ? "forced" : "scheduled",
    type,
    slotHour: currentHour,
  };
}
