import { NotificationLog } from "@/models/NotificationLog";
import type { PushNotificationType } from "@/lib/push/types";

export interface LogNotificationInput {
  userId: string;
  userEmail: string;
  userName: string;
  type: PushNotificationType;
  title: string;
  body: string;
  url: string;
  localDate: string;
  timezone: string;
  slotHour?: number;
  sentCountAfter: number;
  devicesTargeted: number;
  devicesDelivered: number;
  scheduleReason: string;
}

export async function logNotificationDelivery(input: LogNotificationInput) {
  const status = input.devicesDelivered > 0 ? "sent" : "failed";

  await NotificationLog.create({
    ...input,
    status,
  });
}
