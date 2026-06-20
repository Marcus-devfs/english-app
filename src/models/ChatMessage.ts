import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    corrections: [
      {
        original: String,
        corrected: String,
        explanation: String,
      },
    ],
  },
  { timestamps: true }
);

ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage ??
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
