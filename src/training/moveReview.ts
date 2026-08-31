import { MultiPvCandidate } from '../chess/transpositionResolver';
import {
  classifyMoveAdaptively,
  MoveClassificationResult,
  MoveClassificationType,
} from '../engine/adaptiveClassifier';
import { bestCandidateForSideToMove } from '../engine/evaluationUtils';
import { generateHumanExplanation } from '../explanations/generator';

/**
 * The "what could have been done better" verdict shown after every move the user plays.
 */
export interface MoveReview {
  playedSan: string;
  category: MoveClassificationType;
  label: string;
  evalLossCp: number;
  /** The engine's preferred move, when the user did not find it. */
  bestSan: string | null;
  /** First few moves of the engine's line, to show what the better move leads to. */
  bestLine: string[];
  /** The theory move, when the user left the opening being trained. */
  bookSan: string | null;
  reason: string;
  takeaway: string;
  wasBest: boolean;
  followedBook: boolean;
  classification: MoveClassificationResult;
}

export function buildMoveReview(options: {
  playedSan: string;
  playedUci: string;
  fenBefore: string;
  candidates: MultiPvCandidate[];
  /** The book move that was expected here, if the game was still in theory. */
  bookSan: string | null;
  openingName: string;
}): MoveReview {
  const { playedSan, playedUci, fenBefore, candidates, bookSan, openingName } = options;

  const classification = classifyMoveAdaptively(playedSan, playedUci, candidates, fenBefore);
  const best = bestCandidateForSideToMove(candidates, fenBefore);
  const followedBook = bookSan !== null && bookSan === playedSan;

  const alternative = candidates.find(c => c !== best) ?? null;
  const explanation = generateHumanExplanation(
    playedSan,
    best?.move ?? playedSan,
    alternative?.move ?? null,
    openingName,
    fenBefore
  );

  // Playing the main line is a success even when the engine marginally prefers something else —
  // the point of opening training is to learn the theory move.
  const wasBest = classification.category === 'BEST' || followedBook;

  const reason = followedBook
    ? `${playedSan} is the main line here. ${explanation.whyThisMove}`
    : classification.explanationHint;

  return {
    playedSan,
    category: classification.category,
    label: followedBook && classification.category !== 'BEST' ? 'Main Line' : classification.label,
    evalLossCp: Math.max(0, Math.round(classification.evalDifference)),
    bestSan: best && best.move !== playedSan ? best.move : null,
    bestLine: best ? best.pv.slice(0, 5) : [],
    bookSan: bookSan && bookSan !== playedSan ? bookSan : null,
    reason,
    takeaway: explanation.whatToRemember,
    wasBest,
    followedBook,
    classification,
  };
}
