import { connectDB } from "@/lib/db/mongodb";
import { RateLimit } from "@/models/RateLimit";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
  remaining?: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  await connectDB();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  let doc = await RateLimit.findOne({ key });

  if (!doc || doc.expiresAt <= now) {
    doc = await RateLimit.findOneAndUpdate(
      { key },
      { count: 1, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { new: true }
    );
  }

  if (!doc) {
    return { allowed: true, remaining: limit - 1 };
  }

  if (doc.count > limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000)
    );
    return { allowed: false, retryAfterSec, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, limit - doc.count) };
}

/** Limites padrão pré-lançamento */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  chatDaily: { limit: 50, windowMs: 24 * 60 * 60 * 1000 },
  progressHourly: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
