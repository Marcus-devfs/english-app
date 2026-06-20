import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export function rateLimitExceededResponse(result: RateLimitResult) {
  const retryAfter = result.retryAfterSec ?? 60;
  const response = NextResponse.json(
    {
      success: false,
      error: `Muitas tentativas. Tente novamente em ${retryAfter} segundos.`,
    },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}
