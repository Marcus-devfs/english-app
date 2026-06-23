import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { transcribeAudioWithGemini } from "@/services/transcribe.service";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const transcribeSchema = z.object({
  audioBase64: z.string().min(100),
  mimeType: z.string().min(3).max(64),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const rate = await checkRateLimit(
      `transcribe:${session.userId}`,
      RATE_LIMITS.transcribeDaily.limit,
      RATE_LIMITS.transcribeDaily.windowMs
    );
    if (!rate.allowed) return rateLimitExceededResponse(rate);

    const body = await request.json();
    const parsed = transcribeSchema.safeParse(body);
    if (!parsed.success) return apiError("Áudio inválido", 400);

    const transcript = await transcribeAudioWithGemini(
      parsed.data.audioBase64,
      parsed.data.mimeType
    );

    if (!transcript) {
      return apiSuccess({ transcript: null, source: "failed" as const });
    }

    return apiSuccess({ transcript, source: "gemini" as const });
  } catch (error) {
    return handleApiError(error);
  }
}
