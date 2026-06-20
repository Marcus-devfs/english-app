import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  goal: z
    .enum([
      "career_abroad",
      "travel",
      "academic",
      "conversation",
      "business",
      "tech_career",
    ])
    .optional(),
  preferences: z
    .object({
      language: z.enum(["pt", "en"]).optional(),
      practiceDaysPerWeek: z.number().min(1).max(7).optional(),
      practiceMinutesPerDay: z.number().min(5).max(120).optional(),
      notificationsEnabled: z.boolean().optional(),
      reminderHour: z.number().min(0).max(23).optional(),
      reminderMinute: z.number().min(0).max(59).optional(),
    })
    .optional(),
});

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
