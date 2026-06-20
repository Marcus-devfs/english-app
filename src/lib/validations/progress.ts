import { z } from "zod";

export const progressUpdateSchema = z.object({
  type: z.enum(["lesson", "study"]),
});

export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;
