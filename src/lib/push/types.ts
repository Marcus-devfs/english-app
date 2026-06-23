import type { LearningGoal } from "@/types";

export type PushNotificationType = "daily_invite" | "gentle_nudge" | "streak_risk" | "comeback";

export interface NotificationState {
  date: string;
  sentCount: number;
  lastSentAt?: Date;
  lastType?: PushNotificationType;
}

export interface PushMessageContext {
  firstName: string;
  minutes: number;
  streak: number;
  goal: LearningGoal;
  language: "pt" | "en";
  type: PushNotificationType;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  type: PushNotificationType;
}

export interface ScheduleDecision {
  shouldSend: boolean;
  reason: string;
  type?: PushNotificationType;
  slotHour?: number;
}
