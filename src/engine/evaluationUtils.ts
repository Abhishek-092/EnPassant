import { MultiPvCandidate } from '../chess/transpositionResolver';

/**
 * Engine evaluations flow through the app in WHITE's perspective (positive = White better),
 * because that is what an evaluation bar needs and it keeps values comparable across plies.
 *
 * Move-quality maths needs the opposite: "conceded 40 centipawns" has to mean the same thing
 * for both colours. These helpers convert between the two so the conversion never gets
 * open-coded (and mis-signed) at each call site.
 */

/** Extracts the side to move from a FEN, defaulting to White on malformed input. */
export function sideToMoveFromFen(fen: string): 'w' | 'b' {
  return fen.trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';
}

/** Converts a White-perspective centipawn score into the moving side's perspective. */
export function toSideToMoveCp(whiteCp: number, sideToMove: 'w' | 'b'): number {
  return sideToMove === 'w' ? whiteCp : -whiteCp;
}

/**
 * The candidate that is objectively best for whoever is on move. Stockfish already ranks
 * MultiPV lines best-first, but a cached or reordered result should not be trusted blindly:
 * picking the maximum explicitly keeps the evaluation bar and the opponent honest.
 */
export function bestCandidateForSideToMove(
  candidates: MultiPvCandidate[],
  fen: string
): MultiPvCandidate | null {
  if (!candidates || candidates.length === 0) return null;
  const sideToMove = sideToMoveFromFen(fen);
  return candidates.reduce((best, candidate) =>
    toSideToMoveCp(candidate.evaluation, sideToMove) > toSideToMoveCp(best.evaluation, sideToMove)
      ? candidate
      : best
  );
}

/** Centipawn loss a move concedes versus the best available one, from the mover's perspective. */
export function centipawnLoss(
  candidate: MultiPvCandidate,
  candidates: MultiPvCandidate[],
  fen: string
): number {
  const best = bestCandidateForSideToMove(candidates, fen);
  if (!best) return 0;
  const sideToMove = sideToMoveFromFen(fen);
  return (
    toSideToMoveCp(best.evaluation, sideToMove) - toSideToMoveCp(candidate.evaluation, sideToMove)
  );
}

/**
 * Maps a White-perspective score onto a 0-100 share of the evaluation bar using the standard
 * logistic win-probability curve. A linear mapping would make the bar useless: the difference
 * between +0.2 and +0.6 matters enormously and the difference between +8 and +12 does not.
 *
 * Clamped to 3-97 so the losing side never disappears from the bar entirely.
 */
export function whiteWinShare(whiteCp: number | null, mateScore?: number | null): number {
  if (mateScore !== null && mateScore !== undefined && mateScore !== 0) {
    return mateScore > 0 ? 98 : 2;
  }
  if (whiteCp === null) return 50;

  const winningChances = 2 / (1 + Math.exp(-0.00368208 * whiteCp)) - 1; // -1 .. 1
  return Math.min(97, Math.max(3, 50 + 50 * winningChances));
}

/** Human-readable evaluation: "+1.25", "-0.40", "+M3". */
export function formatEvaluation(whiteCp: number | null, mateScore?: number | null): string {
  if (mateScore !== null && mateScore !== undefined && mateScore !== 0) {
    return `${mateScore > 0 ? '+' : '-'}M${Math.abs(mateScore)}`;
  }
  if (whiteCp === null) return '—';

  const pawns = Math.max(-99.99, Math.min(99.99, whiteCp / 100));
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)}`;
}
