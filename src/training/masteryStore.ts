import { indexedDBStorage, OpeningProgressRecord } from '../storage/indexedDB';
import { MoveClassificationType } from '../engine/adaptiveClassifier';
import { getPositionFingerprint } from '../chess/positionFingerprint';
import { MIN_ELO, nextEloTier, previousEloTier, resolveEngineLevel } from '../engine/eloLevels';

/**
 * Mastery deltas per the training spec. They are applied at a fraction of face value
 * (MASTERY_GAIN_SCALE) because a raw +20 would carry a user through the whole lesson phase inside
 * a single game.
 */
export const MASTERY_DELTA = {
  CORRECT: 20,
  CORRECT_WITH_HINT: 10,
  INCORRECT: -15,
  REPEATED_ERROR: -25,
} as const;

const MASTERY_GAIN_SCALE = 0.25;
const MAX_TRACKED_ERRORS = 24;

/**
 * Calibration gate. The opponent's rating is only established once the user has actually learned
 * the opening — roughly 25 drilled moves, and the book line held to at least 6 plies. Rating an
 * opponent before that would measure unfamiliarity with the theory rather than playing strength.
 */
export const LESSON_TARGET = 25;
export const BOOK_DEPTH_TARGET = 6;

/** Consecutive wins at a rating before a promotion is offered. */
export const WINS_BEFORE_PROMOTION = 2;
/** Consecutive losses before a step down is offered. */
export const LOSSES_BEFORE_DEMOTION = 3;

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
    botElo: null,
    bookDepthReached: 0,
    lessonsCompleted: 0,
    eloManuallySet: false,
    winsAtCurrentElo: 0,
    lossesAtCurrentElo: 0,
    gamesPlayed: 0,
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

// --- Calibration ---

export function isCalibrated(record: OpeningProgressRecord): boolean {
  return record.botElo !== null;
}

/** Whether enough lessons have been drilled to establish a rating. */
export function isReadyForCalibration(record: OpeningProgressRecord): boolean {
  return (
    record.lessonsCompleted >= LESSON_TARGET && record.bookDepthReached >= BOOK_DEPTH_TARGET
  );
}

export function lessonsRemaining(record: OpeningProgressRecord): number {
  return Math.max(0, LESSON_TARGET - record.lessonsCompleted);
}

export function bookDepthRemaining(record: OpeningProgressRecord): number {
  return Math.max(0, BOOK_DEPTH_TARGET - record.bookDepthReached);
}

/**
 * The rating the opponent starts at once the lesson phase is cleared, derived from how cleanly
 * those lessons went. Spans the 800-1200 band, so a beginner meets an 800 middlegame while the
 * opening itself is still handled competently (see `getPhaseElo`).
 */
export function calibrateInitialElo(record: OpeningProgressRecord): number {
  const accuracy = record.attempts > 0 ? record.correct / record.attempts : 0;
  const raw = MIN_ELO + Math.round(accuracy * 400);
  return resolveEngineLevel(raw).tierElo;
}

export async function applyCalibration(
  record: OpeningProgressRecord
): Promise<OpeningProgressRecord> {
  const updated: OpeningProgressRecord = {
    ...record,
    botElo: calibrateInitialElo(record),
    winsAtCurrentElo: 0,
    lossesAtCurrentElo: 0,
  };
  await indexedDBStorage.saveProgress(updated);
  return updated;
}

export async function setBotElo(
  record: OpeningProgressRecord,
  elo: number,
  manual = true
): Promise<OpeningProgressRecord> {
  const updated: OpeningProgressRecord = {
    ...record,
    botElo: resolveEngineLevel(elo).tierElo,
    eloManuallySet: manual || record.eloManuallySet,
    winsAtCurrentElo: 0,
    lossesAtCurrentElo: 0,
  };
  await indexedDBStorage.saveProgress(updated);
  return updated;
}

// --- Game results & rating offers ---

export type GameOutcome = 'WIN' | 'LOSS' | 'DRAW';

export interface EloOffer {
  direction: 'UP' | 'DOWN';
  fromElo: number;
  toElo: number;
  reason: string;
}

/**
 * Records a finished game and, if the record warrants it, returns a proposed rating change.
 * The change is only ever *proposed* — the opponent never gets stronger without being asked.
 */
export async function recordGameResult(
  record: OpeningProgressRecord,
  outcome: GameOutcome
): Promise<{ record: OpeningProgressRecord; offer: EloOffer | null }> {
  const currentElo = record.botElo ?? MIN_ELO;

  const wins = outcome === 'WIN' ? record.winsAtCurrentElo + 1 : 0;
  const losses = outcome === 'LOSS' ? record.lossesAtCurrentElo + 1 : 0;

  const updated: OpeningProgressRecord = {
    ...record,
    botElo: currentElo,
    gamesPlayed: record.gamesPlayed + 1,
    winsAtCurrentElo: wins,
    lossesAtCurrentElo: losses,
  };

  await indexedDBStorage.saveProgress(updated);

  let offer: EloOffer | null = null;

  if (wins >= WINS_BEFORE_PROMOTION) {
    const target = nextEloTier(currentElo);
    if (target) {
      offer = {
        direction: 'UP',
        fromElo: currentElo,
        toElo: target,
        reason: `${wins} straight wins at ${currentElo}. Ready for a stronger opponent?`,
      };
    }
  } else if (losses >= LOSSES_BEFORE_DEMOTION) {
    const target = previousEloTier(currentElo);
    if (target) {
      offer = {
        direction: 'DOWN',
        fromElo: currentElo,
        toElo: target,
        reason: `${losses} losses in a row at ${currentElo}. Ease off to ${target}?`,
      };
    }
  }

  return { record: updated, offer };
}

// --- Loading & per-move updates ---

export async function loadMastery(seed: MasterySeed): Promise<OpeningProgressRecord> {
  const stored = await indexedDBStorage.getProgress(seed.openingId);
  if (!stored) return createSeedProgress(seed);

  // Merge over a fresh seed so records written by older versions gain any new fields.
  return { ...createSeedProgress(seed), ...stored };
}

export async function recordAttempt(
  current: OpeningProgressRecord,
  options: {
    grade: 1 | 2 | 3 | 4 | 5;
    fenBefore: string;
    usedHint: boolean;
    /** True when the move was a book move of the opening being trained — i.e. a lesson. */
    wasBookMove: boolean;
    /** Ply index of the move within the game, for tracking book depth reached. */
    plyIndex: number;
  }
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

  // A lesson is a correctly played move of the opening's own line. Playing on past the book, or
  // guessing wrong, does not count toward the calibration gate.
  const countsAsLesson = isCorrect && options.wasBookMove;
  const bookDepthReached =
    countsAsLesson && !options.usedHint
      ? Math.max(current.bookDepthReached, options.plyIndex + 1)
      : current.bookDepthReached;

  const updated: OpeningProgressRecord = {
    ...current,
    mastery,
    attempts: current.attempts + 1,
    correct: current.correct + (isCorrect ? 1 : 0),
    correctStreak,
    bestStreak: Math.max(current.bestStreak, correctStreak),
    hintsUsed: current.hintsUsed + (options.usedHint ? 1 : 0),
    recentErrorFens,
    lessonsCompleted: current.lessonsCompleted + (countsAsLesson ? 1 : 0),
    bookDepthReached,
    lastTrainedAt: Date.now(),
  };

  await indexedDBStorage.saveProgress(updated);
  return updated;
}
