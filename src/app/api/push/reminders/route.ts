import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { sendPushNotification, isPushConfigured } from "@/lib/push/web-push";
import {
  getCurrentHourInTimezone,
  getTodayInTimezone,
  resolveUserTimezone,
} from "@/lib/push/timezone";
import { isAnyReminderHour } from "@/lib/constants/push";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized", 401);
    }

    if (!isPushConfigured()) {
      return apiError("Push not configured", 503);
    }

    const force = request.nextUrl.searchParams.get("force") === "1";

    await connectDB();

    const candidates = await User.find({
      "preferences.notificationsEnabled": true,
      pushSubscriptions: { $exists: true, $not: { $size: 0 } },
    });

    let sent = 0;
    let failed = 0;
    let matched = 0;
    let skippedHour = 0;
    let skippedStudied = 0;

    for (const user of candidates) {
      const timezone = resolveUserTimezone(user.preferences?.timezone);
      const currentHour = getCurrentHourInTimezone(timezone);
      const today = getTodayInTimezone(timezone);
      const reminderHour = user.preferences?.reminderHour ?? -1;

      if (!force && !isAnyReminderHour(reminderHour) && currentHour !== reminderHour) {
        skippedHour++;
        continue;
      }

      matched++;

      if (user.progress?.lastStudyDate === today) {
        skippedStudied++;
        continue;
      }

      const lang = user.preferences?.language ?? "pt";
      const payload = {
        title: lang === "pt" ? "Norte · Hora de praticar!" : "Norte · Time to practice!",
        body:
          lang === "pt"
            ? `Sua meta: ${user.preferences.practiceMinutesPerDay} min hoje. Mantenha sua streak! 🔥`
            : `Your goal: ${user.preferences.practiceMinutesPerDay} min today. Keep your streak! 🔥`,
        url: "/dashboard",
      };

      for (const sub of user.pushSubscriptions) {
        try {
          await sendPushNotification(sub, payload);
          sent++;
        } catch {
          failed++;
          await User.findByIdAndUpdate(user._id, {
            $pull: { pushSubscriptions: { endpoint: sub.endpoint } },
          });
        }
      }
    }

    return apiSuccess({
      sent,
      failed,
      candidates: candidates.length,
      matched,
      skippedHour,
      skippedStudied,
      force,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
