import { z } from "zod";

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const adminNotificationsSchema = adminPaginationSchema.extend({
  status: z.enum(["sent", "failed"]).optional(),
  userId: z.string().optional(),
});
