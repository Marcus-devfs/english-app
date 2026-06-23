import mongoose, { Schema, Document, Model } from "mongoose";
import type { CEFRLevel, LearningGoal, QuizQuestion, UserProgress } from "@/types";
import type { UserPreferences } from "@/lib/i18n/translations";
import { DEFAULT_PREFERENCES } from "@/lib/i18n/translations";
import type { NotificationState } from "@/lib/push/types";
import type { UserSubscription } from "@/types/subscription";

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

export type UserRole = "user" | "admin";

export interface CachedQuiz {
  quizId: string;
  questions: QuizQuestion[];
  xpAwarded: boolean;
  completedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  goal?: LearningGoal;
  selfAssessedLevel?: CEFRLevel;
  diagnosedLevel?: CEFRLevel;
  onboardingCompleted: boolean;
  progress: UserProgress;
  preferences: UserPreferences;
  pushSubscriptions: PushSubscriptionData[];
  notificationState?: NotificationState;
  cachedQuiz?: CachedQuiz;
  subscription: UserSubscription;
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
    reminderHour: { type: Number, default: -1, min: -1, max: 23 },
    reminderMinute: { type: Number, default: 0, min: 0, max: 59 },
    timezone: { type: String, default: "America/Sao_Paulo" },
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

const CachedQuizSchema = new Schema(
  {
    quizId: { type: String, required: true },
    questions: { type: Schema.Types.Mixed, required: true },
    xpAwarded: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const NotificationStateSchema = new Schema(
  {
    date: { type: String, required: true },
    sentCount: { type: Number, default: 0, min: 0 },
    lastSentAt: { type: Date },
    lastType: {
      type: String,
      enum: ["daily_invite", "gentle_nudge", "streak_risk"],
    },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "inactive"],
      default: "inactive",
    },
    source: { type: String, enum: ["mock", "stripe"], default: "mock" },
    currentPeriodEnd: { type: Date },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    mockGrantedAt: { type: Date },
    mockMonths: { type: Number, min: 1, max: 24 },
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
    role: { type: String, enum: ["user", "admin"], default: "user" },
    goal: { type: String },
    selfAssessedLevel: { type: String },
    diagnosedLevel: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    progress: { type: ProgressSchema, default: () => ({}) },
    preferences: { type: PreferencesSchema, default: () => ({ ...DEFAULT_PREFERENCES }) },
    pushSubscriptions: { type: [PushSubscriptionSchema], default: [] },
    notificationState: { type: NotificationStateSchema },
    cachedQuiz: { type: CachedQuizSchema },
    subscription: { type: SubscriptionSchema, default: () => ({ plan: "free", status: "inactive" }) },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
