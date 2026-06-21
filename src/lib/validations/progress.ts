import { z } from "zod";

const learningGoals = [
  "career_abroad",
  "travel",
  "academic",
  "conversation",
  "business",
  "tech_career",
] as const;

export const progressUpdateSchema = z.object({
  type: z.enum(["lesson", "study"]),
  lessonId: z.string().min(1).max(32).optional(),
  trailIndex: z.number().int().min(0).optional(),
  title: z.string().min(1).max(120).optional(),
  goal: z.enum(learningGoals).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  score: z.number().min(0).max(100).optional(),
  stepsCompleted: z.array(z.string()).optional(),
  isReview: z.boolean().optional(),
});

export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;

export const adminSubscriptionSchema = z.object({
  plan: z.enum(["free", "pro"]),
  status: z.enum(["active", "canceled", "past_due", "inactive"]).optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  months: z.number().int().min(1).max(24).optional(),
});

export const interviewMessageSchema = z.object({
  action: z.enum(["start", "message", "finish"]),
  sessionId: z.string().optional(),
  message: z.string().min(1).max(2000).optional(),
});
