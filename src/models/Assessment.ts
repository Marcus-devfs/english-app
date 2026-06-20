import mongoose, { Schema, Document, Model } from "mongoose";
import type { AssessmentAnswer, CEFRLevel } from "@/types";

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  selfAssessedLevel: CEFRLevel;
  diagnosedLevel: CEFRLevel;
  score: number;
  totalQuestions: number;
  answers: AssessmentAnswer[];
  skillBreakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  createdAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    selfAssessedLevel: { type: String, required: true },
    diagnosedLevel: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: [
      {
        questionId: String,
        answer: String,
        isCorrect: Boolean,
        timeSpentMs: Number,
      },
    ],
    skillBreakdown: { type: Map, of: Number },
    strengths: [String],
    weaknesses: [String],
    recommendation: String,
  },
  { timestamps: true }
);

AssessmentSchema.index({ userId: 1, createdAt: -1 });

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ??
  mongoose.model<IAssessment>("Assessment", AssessmentSchema);
