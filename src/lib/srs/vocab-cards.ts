import { VocabCard } from "@/models/VocabCard";
import type { LearningGoal } from "@/types";

export async function upsertVocabCards(
  userId: string,
  goal: LearningGoal,
  items: { word: string; meaning: string; example?: string }[],
  source: "lesson" | "quiz" | "chat" | "speech"
) {
  for (const item of items) {
    const word = item.word.trim().toLowerCase();
    if (!word || word.length < 2) continue;

    await VocabCard.findOneAndUpdate(
      { userId, word },
      {
        $setOnInsert: {
          userId,
          word,
          meaning: item.meaning,
          example: item.example,
          goal,
          source,
          ease: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: new Date(),
        },
      },
      { upsert: true }
    );
  }
}
