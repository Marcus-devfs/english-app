import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateSpeechAudio } from "@/services/tts.service";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const ttsSchema = z.object({
  text: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const rate = await checkRateLimit(
      `tts:${session.userId}`,
      RATE_LIMITS.ttsDaily.limit,
      RATE_LIMITS.ttsDaily.windowMs
    );
    if (!rate.allowed) {
      return rateLimitExceededResponse(rate);
    }

    const body = await request.json();
    const parsed = ttsSchema.safeParse(body);
    if (!parsed.success) return apiError("Texto inválido", 400);

    const result = await generateSpeechAudio(parsed.data.text);

    if (!result) {
      return apiSuccess({ audioBase64: null, source: "browser" as const });
    }

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
