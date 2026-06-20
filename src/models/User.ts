import mongoose, { Schema, Document, Model } from "mongoose";
import type { CEFRLevel, LearningGoal, UserProgress } from "@/types";
import type { UserPreferences } from "@/lib/i18n/translations";
import { DEFAULT_PREFERENCES } from "@/lib/i18n/translations";

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  goal?: LearningGoal;
  selfAssessedLevel?: CEFRLevel;
  diagnosedLevel?: CEFRLevel;
  onboardingCompleted: boolean;
  progress: UserProgress;
  preferences: UserPreferences;
  pushSubscriptions: PushSubscriptionData[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema(
  {
    currentLevel: { type: String, default: "A1" },
    targetLevel: { type: String, default: "B2" },
    lessonsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastStudyDate: { type: String },
    grammarScore: { type: Number, default: 0 },
    vocabularyScore: { type: Number, default: 0 },
    speakingScore: { type: Number, default: 0 },
    readingScore: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
  },
  { _id: false }
);

const PreferencesSchema = new Schema(
  {
    language: { type: String, enum: ["pt", "en"], default: "pt" },
    practiceDaysPerWeek: { type: Number, default: 5, min: 1, max: 7 },
    practiceMinutesPerDay: { type: Number, default: 15, min: 5, max: 120 },
    notificationsEnabled: { type: Boolean, default: false },
    reminderHour: { type: Number, default: 9, min: 0, max: 23 },
    reminderMinute: { type: Number, default: 0, min: 0, max: 59 },
  },
  { _id: false }
);

const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    goal: { type: String },
    selfAssessedLevel: { type: String },
    diagnosedLevel: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    progress: { type: ProgressSchema, default: () => ({}) },
    preferences: { type: PreferencesSchema, default: () => ({ ...DEFAULT_PREFERENCES }) },
    pushSubscriptions: { type: [PushSubscriptionSchema], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
