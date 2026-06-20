import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:support@norte.app";

export function isPushConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

export function getVapidPublicKey(): string | undefined {
  return publicKey;
}

export function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
  return true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
) {
  if (!configureWebPush()) {
    throw new Error("Push notifications not configured");
  }

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    JSON.stringify(payload)
  );
}
