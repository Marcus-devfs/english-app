import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { LearningGoal, CEFRLevel } from "@/types";

export interface ILessonCompletion extends Document {
  userId: Types.ObjectId;
  lessonId: string;
  trailIndex: number;
  goal: LearningGoal;
  title: string;
  level: CEFRLevel;
  score?: number;
  stepsCompleted: string[];
  xpEarned: number;
  isReview: boolean;
  completedAt: Date;
}

const LessonCompletionSchema = new Schema<ILessonCompletion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lessonId: { type: String, required: true },
    trailIndex: { type: Number, required: true, min: 0 },
    goal: { type: String, required: true },
    title: { type: String, required: true },
    level: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    stepsCompleted: { type: [String], default: [] },
    xpEarned: { type: Number, default: 20 },
    isReview: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LessonCompletionSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonCompletionSchema.index({ userId: 1, completedAt: -1 });

export const LessonCompletion: Model<ILessonCompletion> =
  mongoose.models.LessonCompletion ??
  mongoose.model<ILessonCompletion>("LessonCompletion", LessonCompletionSchema);
