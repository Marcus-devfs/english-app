import { subscribeToPush } from "@/lib/push/client";

export async function enablePushNotifications(): Promise<boolean> {
  const ok = await subscribeToPush();
  if (!ok) return false;

  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Sao_Paulo";

  await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferences: {
        notificationsEnabled: true,
        timezone,
      },
    }),
  });

  return true;
}
