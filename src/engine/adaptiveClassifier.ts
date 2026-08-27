import { MultiPvCandidate } from '../chess/transpositionResolver';

export type MoveClassificationType =
  | 'BEST'
  | 'EXCELLENT'
  | 'GOOD'
  | 'INACCURACY'
  | 'MISTAKE'
  | 'BLUNDER';

export interface MoveClassificationResult {
  category: MoveClassificationType;
  label: string;
  evalDifference: number; // In centipawns (positive means loss)
  userMoveEval: number;
  bestMoveEval: number;
  isTopEngineMove: boolean;
  multiPvRank: number | null;
  explanationHint: string;
}

/**
 * Adaptive Move Classifier
 * Does NOT rely on rigid fixed centipawn loss thresholds alone.
 * Considers absolute evaluation scale (+5.0 vs +0.2), evaluation state transitions,
 * MultiPV candidate presence/rank, and position context.
 */
export function classifyMoveAdaptively(
  userMoveSan: string,
  userMoveUci: string,
  candidates: MultiPvCandidate[],
  currentFen: string
): MoveClassificationResult {
  if (!candidates || candidates.length === 0) {
    return {
      category: 'GOOD',
      label: 'Playable Move',
      evalDifference: 0,
      userMoveEval: 0,
      bestMoveEval: 0,
      isTopEngineMove: false,
      multiPvRank: null,
      explanationHint: 'Curated move analysis',
    };
  }

  const bestCandidate = candidates[0];
  const bestEval = bestCandidate.evaluation;

  // Find user move in MultiPV candidates
  const matchingCandidateIndex = candidates.findIndex(
    c => c.move === userMoveSan || c.uci === userMoveUci
  );

  if (matchingCandidateIndex === 0) {
    return {
      category: 'BEST',
      label: 'Best Move',
      evalDifference: 0,
      userMoveEval: bestEval,
      bestMoveEval: bestEval,
      isTopEngineMove: true,
      multiPvRank: 1,
      explanationHint: 'Top choice recommended by Stockfish engine analysis.',
    };
  }

  let userEval = 0;
  let rank: number | null = null;

  if (matchingCandidateIndex > 0) {
    const candidate = candidates[matchingCandidateIndex];
    userEval = candidate.evaluation;
    rank = candidate.rank;
  } else {
    // If not in top MultiPV, estimate evaluation drop based on last candidate
    const worstCandidateEval = candidates[candidates.length - 1].evaluation;
    userEval = worstCandidateEval - 120; // Estimated penalty beyond MultiPV window
    rank = candidates.length + 1;
  }

  // Calculate centipawn evaluation loss relative to side to move
  const evalLoss = bestEval - userEval;

  // Contextual scaling:
  // 1. Decisive Advantage Context: If position is +4.00 or higher, losing 0.50 cp leaves user winning (+3.50).
  const isDecisivelyWinning = bestEval > 350;
  // 2. Critical Equal/Slight Context: If position is +0.20 and drops to -0.40, evaluation flips sign.
  const evalSignFlipped = (bestEval >= 0 && userEval < -30) || (bestEval >= -30 && userEval < -100);

  let category: MoveClassificationType = 'GOOD';
  let label = 'Playable Move';

  if (matchingCandidateIndex === 1 && evalLoss <= 25) {
    category = 'EXCELLENT';
    label = 'Excellent Move';
  } else if (evalLoss <= 20 || (isDecisivelyWinning && evalLoss <= 60)) {
    category = 'EXCELLENT';
    label = 'Near-Best Move';
  } else if (evalLoss <= 50 || (isDecisivelyWinning && evalLoss <= 120)) {
    category = 'GOOD';
    label = 'Playable Move';
  } else if (evalLoss <= 110 && !evalSignFlipped) {
    category = 'INACCURACY';
    label = 'Inaccuracy';
  } else if (evalLoss <= 220 || evalSignFlipped) {
    category = 'MISTAKE';
    label = 'Mistake';
  } else {
    category = 'BLUNDER';
    label = 'Blunder';
  }

  const hint = getCategoryHint(category, bestCandidate.move, evalLoss);

  return {
    category,
    label,
    evalDifference: evalLoss,
    userMoveEval: userEval,
    bestMoveEval: bestEval,
    isTopEngineMove: false,
    multiPvRank: rank,
    explanationHint: hint,
  };
}

function getCategoryHint(category: MoveClassificationType, bestMove: string, loss: number): string {
  switch (category) {
    case 'EXCELLENT':
      return `Nearly as strong as ${bestMove}. Retains your strategic initiative.`;
    case 'GOOD':
      return `Solid move, though ${bestMove} offers slightly tighter central control.`;
    case 'INACCURACY':
      return `Slight inaccuracy. Consider how ${bestMove} directly challenges the position.`;
    case 'MISTAKE':
      return `Misses the main strategic idea. Look for key pawn breaks or tactical defenses.`;
    case 'BLUNDER':
      return `Significant tactical or positional concession. Re-evaluate piece safety and king structure.`;
    default:
      return '';
  }
}
