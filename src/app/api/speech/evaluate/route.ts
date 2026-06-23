import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { evaluateSpeechWithAI } from "@/services/speech.service";
import { upsertVocabCards } from "@/lib/srs/vocab-cards";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { LearningGoal } from "@/types";
import { z } from "zod";

const speechSchema = z.object({
  transcript: z.string().max(2000),
  targetPhrase: z.string().max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = speechSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const result = await evaluateSpeechWithAI(
      parsed.data.transcript,
      parsed.data.targetPhrase
    );

    if (!result.passed && result.missing?.length) {
      await connectDB();
      const user = await User.findById(session.userId);
      if (user) {
        await upsertVocabCards(
          session.userId,
          (user.goal ?? "conversation") as LearningGoal,
          result.missing.map((m) => {
            const word = m.replace(/Fale «|» com mais clareza/g, "");
            return { word, meaning: parsed.data.targetPhrase };
          }),
          "speech"
        );
      }
    }

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
