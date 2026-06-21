import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { LearningGoal, CEFRLevel } from "@/types";

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface IInterviewSession extends Document {
  userId: Types.ObjectId;
  status: "active" | "completed" | "abandoned";
  goal: LearningGoal;
  level: CEFRLevel;
  studyContext: string;
  messages: InterviewMessage[];
  feedback?: InterviewFeedback;
  startedAt: Date;
  completedAt?: Date;
}

const InterviewMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewFeedbackSchema = new Schema(
  {
    overallScore: { type: Number, min: 0, max: 100 },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    summary: { type: String },
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    goal: { type: String, required: true },
    level: { type: String, required: true },
    studyContext: { type: String, default: "" },
    messages: { type: [InterviewMessageSchema], default: [] },
    feedback: { type: InterviewFeedbackSchema },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1, status: 1 });
InterviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession: Model<IInterviewSession> =
  mongoose.models.InterviewSession ??
  mongoose.model<IInterviewSession>("InterviewSession", InterviewSessionSchema);
