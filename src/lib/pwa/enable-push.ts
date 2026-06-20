import { subscribeToPush, type PushSubscribeResult } from "@/lib/push/client";

export type { PushSubscribeResult };

export async function enablePushNotifications(): Promise<PushSubscribeResult> {
  const result = await subscribeToPush();
  if (!result.success) return result;

  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Sao_Paulo";

  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferences: {
        notificationsEnabled: true,
        timezone,
      },
    }),
  });

  if (!res.ok) {
    return { success: false, reason: "api_error" };
  }

  return { success: true };
}
