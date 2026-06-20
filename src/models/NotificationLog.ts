import mongoose, { Schema, Document, Model } from "mongoose";
import type { PushNotificationType } from "@/lib/push/types";

export type NotificationDeliveryStatus = "sent" | "failed";

export interface INotificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  type: PushNotificationType;
  title: string;
  body: string;
  url: string;
  status: NotificationDeliveryStatus;
  localDate: string;
  timezone: string;
  slotHour?: number;
  sentCountAfter: number;
  devicesTargeted: number;
  devicesDelivered: number;
  scheduleReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    userName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["daily_invite", "gentle_nudge", "streak_risk"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    localDate: { type: String, required: true },
    timezone: { type: String, required: true },
    slotHour: { type: Number, min: 0, max: 23 },
    sentCountAfter: { type: Number, required: true, min: 1 },
    devicesTargeted: { type: Number, required: true, min: 0 },
    devicesDelivered: { type: Number, required: true, min: 0 },
    scheduleReason: { type: String, required: true },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ userId: 1, createdAt: -1 });
NotificationLogSchema.index({ userEmail: 1, createdAt: -1 });
NotificationLogSchema.index({ localDate: 1, createdAt: -1 });

export const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ??
  mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema);
