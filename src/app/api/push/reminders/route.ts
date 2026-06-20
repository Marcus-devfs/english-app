import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { sendPushNotification, isPushConfigured } from "@/lib/push/web-push";
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

    await connectDB();

    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();

    const users = await User.find({
      "preferences.notificationsEnabled": true,
      pushSubscriptions: { $exists: true, $not: { $size: 0 } },
      "preferences.reminderHour": currentHour,
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (user.progress?.lastStudyDate === today) continue;

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

    return apiSuccess({ sent, failed, processed: users.length });
  } catch (error) {
    return handleApiError(error);
  }
}
