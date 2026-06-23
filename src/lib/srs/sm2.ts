export interface SrsCardState {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

/** SM-2 simplificado. quality: 0-5 (0=errou, 3=difícil, 5=fácil) */
export function sm2Update(
  state: SrsCardState,
  quality: number
): SrsCardState {
  let { ease, interval, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease);

    repetitions += 1;
    ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { ease, interval, repetitions, nextReview };
}

export function qualityFromCorrect(correct: boolean, hard = false): number {
  if (!correct) return 1;
  return hard ? 3 : 4;
}
