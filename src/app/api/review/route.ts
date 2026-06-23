import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { VocabCard } from "@/models/VocabCard";
import { getSession } from "@/lib/auth/session";
import { sm2Update, qualityFromCorrect } from "@/lib/srs/sm2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const reviewSchema = z.object({
  cardId: z.string(),
  correct: z.boolean(),
  hard: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();

    const dueCards = await VocabCard.find({
      userId: session.userId,
      nextReview: { $lte: new Date() },
    })
      .sort({ nextReview: 1 })
      .limit(10)
      .lean();

    const totalCards = await VocabCard.countDocuments({ userId: session.userId });

    return apiSuccess({
      cards: dueCards.map((c) => ({
        id: c._id,
        word: c.word,
        meaning: c.meaning,
        example: c.example,
      })),
      dueCount: dueCards.length,
      totalCards,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Dados inválidos", 400);
    }

    await connectDB();

    const card = await VocabCard.findOne({
      _id: parsed.data.cardId,
      userId: session.userId,
    });

    if (!card) return apiError("Card não encontrado", 404);

    const quality = qualityFromCorrect(parsed.data.correct, parsed.data.hard);
    const updated = sm2Update(
      {
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions,
        nextReview: card.nextReview,
      },
      quality
    );

    card.ease = updated.ease;
    card.interval = updated.interval;
    card.repetitions = updated.repetitions;
    card.nextReview = updated.nextReview;
    await card.save();

    return apiSuccess({ nextReview: card.nextReview });
  } catch (error) {
    return handleApiError(error);
  }
}
