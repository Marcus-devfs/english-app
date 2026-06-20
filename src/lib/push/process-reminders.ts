import { connectDB } from "@/lib/db/mongodb";
import { User, type IUser } from "@/models/User";
import { sendPushNotification, isPushConfigured } from "@/lib/push/web-push";
import { buildPushPayload } from "@/lib/push/personalize";
import { evaluateReminderSchedule } from "@/lib/push/scheduler";
import { getTodayInTimezone, resolveUserTimezone } from "@/lib/push/timezone";
import type { NotificationState, PushNotificationType } from "@/lib/push/types";

export interface ProcessRemindersResult {
  sent: number;
  failed: number;
  candidates: number;
  matched: number;
  skipped: Record<string, number>;
  force: boolean;
  hint?: string;
}

function bumpSkip(skipped: Record<string, number>, reason: string) {
  skipped[reason] = (skipped[reason] ?? 0) + 1;
}

async function markNotificationSent(
  userId: string,
  today: string,
  sentCount: number,
  type: PushNotificationType
) {
  const state: NotificationState = {
    date: today,
    sentCount: sentCount + 1,
    lastSentAt: new Date(),
    lastType: type,
  };

  await User.findByIdAndUpdate(userId, { notificationState: state });
}

export async function processReminders(force = false): Promise<ProcessRemindersResult> {
  await connectDB();

  const candidates = await User.find({
    "preferences.notificationsEnabled": true,
    pushSubscriptions: { $exists: true, $not: { $size: 0 } },
  });

  let sent = 0;
  let failed = 0;
  let matched = 0;
  const skipped: Record<string, number> = {};

  for (const user of candidates) {
    const timezone = resolveUserTimezone(user.preferences?.timezone);
    const today = getTodayInTimezone(timezone);
    const reminderHour = user.preferences?.reminderHour ?? -1;

    const decision = evaluateReminderSchedule({
      timezone,
      reminderHour,
      streakDays: user.progress?.streakDays ?? 0,
      lastStudyDate: user.progress?.lastStudyDate,
      notificationState: user.notificationState as NotificationState | undefined,
      force,
    });

    if (!decision.shouldSend || !decision.type) {
      bumpSkip(skipped, decision.reason);
      continue;
    }

    matched++;

    const payload = buildPushPayload(user as IUser, decision.type);
    let userSent = 0;

    for (const sub of user.pushSubscriptions) {
      try {
        await sendPushNotification(sub, {
          title: payload.title,
          body: payload.body,
          url: payload.url,
        });
        sent++;
        userSent++;
      } catch {
        failed++;
        await User.findByIdAndUpdate(user._id, {
          $pull: { pushSubscriptions: { endpoint: sub.endpoint } },
        });
      }
    }

    if (userSent > 0) {
      const currentCount =
        user.notificationState?.date === today
          ? (user.notificationState.sentCount ?? 0)
          : 0;
      await markNotificationSent(String(user._id), today, currentCount, decision.type);
    }
  }

  return {
    sent,
    failed,
    candidates: candidates.length,
    matched,
    skipped,
    force,
    hint:
      sent === 0
        ? "Slots: 8h e 19h–21h (fuso do usuário). daily_cap_reached = já recebeu 2 hoje. wrong_slot = fora do horário. already_studied_today = praticou hoje."
        : undefined,
  };
}
