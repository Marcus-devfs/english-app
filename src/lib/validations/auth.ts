import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const onboardingGoalSchema = z.object({
  goal: z.enum([
    "career_abroad",
    "travel",
    "academic",
    "conversation",
    "business",
    "tech_career",
  ]),
  selfAssessedLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export const assessmentSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
      timeSpentMs: z.number().optional(),
    })
  ),
  selfAssessedLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const quizSubmitSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingGoalInput = z.infer<typeof onboardingGoalSchema>;
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
