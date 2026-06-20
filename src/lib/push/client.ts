import {
  getNotificationPermissionState,
  type PushSubscribeFailureReason,
  type PushSubscribeResult,
} from "@/lib/pwa/notification-permission";

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type { PushSubscribeResult, PushSubscribeFailureReason };

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, reason: "unsupported" };
  }

  if (!("Notification" in window)) {
    return { success: false, reason: "unsupported" };
  }

  if (Notification.permission === "denied") {
    return { success: false, reason: "denied" };
  }

  const keyRes = await fetch("/api/push/subscribe");
  const keyData = await keyRes.json();
  const publicKey = keyData.data?.publicKey;
  if (!publicKey) return { success: false, reason: "no_vapid" };

  let permission: NotificationPermission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") {
    return { success: false, reason: "denied" };
  }

  if (permission !== "granted") {
    return { success: false, reason: "dismissed" };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "America/Sao_Paulo",
    }),
  });

  if (!res.ok) {
    return { success: false, reason: "api_error" };
  }

  return { success: true };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();

  const res = await fetch("/api/push/subscribe", { method: "DELETE" });
  return res.ok;
}
