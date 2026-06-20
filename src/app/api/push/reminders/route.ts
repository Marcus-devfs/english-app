import { NextRequest } from "next/server";
import { isPushConfigured } from "@/lib/push/web-push";
import { processReminders } from "@/lib/push/process-reminders";
import { isProduction } from "@/lib/security/env";
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

    const forceRequested = request.nextUrl.searchParams.get("force") === "1";
    const force = forceRequested && !isProduction();
    const result = await processReminders(force);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
