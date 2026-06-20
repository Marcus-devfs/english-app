import mongoose, { Schema, Document, Model } from "mongoose";
import type { CEFRLevel, LearningGoal, UserProgress } from "@/types";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  goal?: LearningGoal;
  selfAssessedLevel?: CEFRLevel;
  diagnosedLevel?: CEFRLevel;
  onboardingCompleted: boolean;
  progress: UserProgress;
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
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
