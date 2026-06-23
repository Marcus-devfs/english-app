import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { LearningGoal } from "@/types";

export interface IVocabCard extends Document {
  userId: Types.ObjectId;
  word: string;
  meaning: string;
  example?: string;
  goal: LearningGoal;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  source: "lesson" | "quiz" | "chat" | "speech";
  createdAt: Date;
  updatedAt: Date;
}

const VocabCardSchema = new Schema<IVocabCard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    word: { type: String, required: true, trim: true },
    meaning: { type: String, required: true, trim: true },
    example: { type: String },
    goal: { type: String, required: true },
    ease: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    nextReview: { type: Date, default: Date.now, index: true },
    source: {
      type: String,
      enum: ["lesson", "quiz", "chat", "speech"],
      default: "lesson",
    },
  },
  { timestamps: true }
);

VocabCardSchema.index({ userId: 1, word: 1 }, { unique: true });

export const VocabCard: Model<IVocabCard> =
  mongoose.models.VocabCard ??
  mongoose.model<IVocabCard>("VocabCard", VocabCardSchema);
