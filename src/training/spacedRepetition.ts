import { UserMistakeRecord } from '../storage/indexedDB';

export interface SpacedItem {
  id: string;
  fen: string;
  interval: number; // Days until next review
  repetition: number; // Number of consecutive correct reviews
  easeFactor: number; // SuperMemo ease factor (default 2.5)
  nextReviewAt: number; // Timestamp
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition implementation tailored for chess training positions.
 * Grade scale:
 * 5 = Top Engine Move found instantly
 * 4 = Top/Near-Best Engine move found after 1 hint
 * 3 = Acceptable move found
 * 2 = Inaccuracy made
 * 1 = Mistake or Blunder made
 */
export function calculateNextReview(
  item: SpacedItem,
  grade: 1 | 2 | 3 | 4 | 5
): SpacedItem {
  let { interval, repetition, easeFactor } = item;

  if (grade >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1; // Reset to daily review on mistakes
  }

  // Update Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // Floor limit

  const nextReviewAt = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    ...item,
    interval,
    repetition,
    easeFactor,
    nextReviewAt,
  };
}
