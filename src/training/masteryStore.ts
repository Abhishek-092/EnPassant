import { indexedDBStorage, OpeningProgressRecord } from '../storage/indexedDB';
import { MoveClassificationType } from '../engine/adaptiveClassifier';
import { getPositionFingerprint } from '../chess/positionFingerprint';

/**
 * Mastery deltas per the training spec. They are applied at a fraction of face value
 * (MASTERY_GAIN_SCALE) because a raw +20 would promote the opponent from Apprentice to Master
 * inside a single game, which defeats the point of a difficulty ramp.
 */
export const MASTERY_DELTA = {
  CORRECT: 20,
  CORRECT_WITH_HINT: 10,
  INCORRECT: -15,
  REPEATED_ERROR: -25,
} as const;

const MASTERY_GAIN_SCALE = 0.25;
const MAX_TRACKED_ERRORS = 24;

export interface MasterySeed {
  openingId: string;
  eco: string;
  name: string;
  variationName?: string;
  userColor: 'white' | 'black';
}

export function createSeedProgress(seed: MasterySeed): OpeningProgressRecord {
  return {
    openingId: seed.openingId,
    eco: seed.eco,
    name: seed.name,
    variationName: seed.variationName,
    userColor: seed.userColor,
    mastery: 0,
    attempts: 0,
    correct: 0,
    correctStreak: 0,
    bestStreak: 0,
    hintsUsed: 0,
    recentErrorFens: [],
    lastTrainedAt: 0,
  };
}

/** Maps a move classification onto the SM-2 grade scale used by the review scheduler. */
export function gradeFromClassification(
  category: MoveClassificationType,
  usedHint: boolean
): 1 | 2 | 3 | 4 | 5 {
  switch (category) {
    case 'BEST':
      return usedHint ? 4 : 5;
    case 'EXCELLENT':
      return usedHint ? 3 : 4;
    case 'GOOD':
      return 3;
    case 'INACCURACY':
      return 2;
    default:
      return 1;
  }
}

/**
 * Mastery the opponent's level is actually derived from. The ceiling rises with sample size so
 * three lucky moves cannot unlock Master strength — the opponent has to be earned.
 */
export function effectiveMastery(record: OpeningProgressRecord): number {
  return Math.max(0, Math.min(record.mastery, record.attempts * 4));
}

/** Drilled moves still needed before the confidence ceiling stops holding the level back. */
export function attemptsUntilUnlocked(record: OpeningProgressRecord): number {
  if (record.mastery <= record.attempts * 4) return 0;
  return Math.ceil(record.mastery / 4) - record.attempts;
}

export async function loadMastery(seed: MasterySeed): Promise<OpeningProgressRecord> {
  const stored = await indexedDBStorage.getProgress(seed.openingId);
  if (!stored) return createSeedProgress(seed);

  // Merge over a fresh seed so records written by older versions gain any new fields.
  return { ...createSeedProgress(seed), ...stored };
}

export async function recordAttempt(
  current: OpeningProgressRecord,
  options: { grade: 1 | 2 | 3 | 4 | 5; fenBefore: string; usedHint: boolean }
): Promise<OpeningProgressRecord> {
  const positionKey = getPositionFingerprint(options.fenBefore).transpositionKey;
  const isCorrect = options.grade >= 3;
  const isRepeatedError = !isCorrect && current.recentErrorFens.includes(positionKey);

  const rawDelta = isCorrect
    ? options.usedHint
      ? MASTERY_DELTA.CORRECT_WITH_HINT
      : MASTERY_DELTA.CORRECT
    : isRepeatedError
      ? MASTERY_DELTA.REPEATED_ERROR
      : MASTERY_DELTA.INCORRECT;

  const mastery = Math.max(0, Math.min(100, current.mastery + rawDelta * MASTERY_GAIN_SCALE));
  const correctStreak = isCorrect ? current.correctStreak + 1 : 0;

  const recentErrorFens = isCorrect
    ? current.recentErrorFens.filter(key => key !== positionKey)
    : [positionKey, ...current.recentErrorFens.filter(key => key !== positionKey)].slice(
        0,
        MAX_TRACKED_ERRORS
      );

  const updated: OpeningProgressRecord = {
    ...current,
    mastery,
    attempts: current.attempts + 1,
    correct: current.correct + (isCorrect ? 1 : 0),
    correctStreak,
    bestStreak: Math.max(current.bestStreak, correctStreak),
    hintsUsed: current.hintsUsed + (options.usedHint ? 1 : 0),
    recentErrorFens,
    lastTrainedAt: Date.now(),
  };

  await indexedDBStorage.saveProgress(updated);
  return updated;
}
