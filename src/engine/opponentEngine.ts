import { Chess } from 'chess.js';
import { stockfishEngine } from './stockfishWorker';
import { MultiPvCandidate } from '../chess/transpositionResolver';
import { SearchProfileName } from './stockfish/types';
import { bestCandidateForSideToMove, sideToMoveFromFen, toSideToMoveCp } from './evaluationUtils';

export type OpponentLevelName = 'APPRENTICE' | 'CHALLENGER' | 'CLUB' | 'EXPERT' | 'MASTER';

export interface OpponentLevel {
  name: OpponentLevelName;
  label: string;
  masteryFloor: number;
  searchProfile: SearchProfileName;
  /** Wider MultiPV at low levels so there are genuinely weaker moves available to choose. */
  multiPv: number;
  /** How much evaluation the opponent is willing to hand you, in centipawns. */
  concessionBudgetCp: number;
  /** 0 = always plays the best allowed move, 1 = always plays the weakest allowed move. */
  weaknessBias: number;
  description: string;
}

/**
 * The opponent is weakened by *choosing* a deliberately inferior legal move from the engine's
 * own candidate list, not by lowering depth alone. A shallow engine plays randomly bad moves;
 * a strong engine picking its 4th-best move plays coherently but leaves the loose pieces and
 * soft squares that make an attack possible — which is what a learner needs to practise against.
 */
export const OPPONENT_LEVELS: OpponentLevel[] = [
  {
    name: 'APPRENTICE',
    label: 'Apprentice',
    masteryFloor: 0,
    searchProfile: 'FAST',
    multiPv: 5,
    concessionBudgetCp: 220,
    weaknessBias: 0.95,
    description: 'Leaves loose pieces and soft squares. Go hunting.',
  },
  {
    name: 'CHALLENGER',
    label: 'Challenger',
    masteryFloor: 20,
    searchProfile: 'FAST',
    multiPv: 5,
    concessionBudgetCp: 140,
    weaknessBias: 0.75,
    description: 'Develops sensibly but still loses the thread.',
  },
  {
    name: 'CLUB',
    label: 'Club Player',
    masteryFloor: 40,
    searchProfile: 'TRAINING',
    multiPv: 4,
    concessionBudgetCp: 70,
    weaknessBias: 0.5,
    description: 'Solid club strength. Punishes lazy moves.',
  },
  {
    name: 'EXPERT',
    label: 'Expert',
    masteryFloor: 60,
    searchProfile: 'TRAINING',
    multiPv: 3,
    concessionBudgetCp: 30,
    weaknessBias: 0.25,
    description: 'Near-best play. Only real ideas work here.',
  },
  {
    name: 'MASTER',
    label: 'Master',
    masteryFloor: 80,
    searchProfile: 'DEEP',
    multiPv: 3,
    concessionBudgetCp: 0,
    weaknessBias: 0,
    description: 'Top engine choice at depth 20. No gifts.',
  },
];

export function getOpponentLevel(mastery: number): OpponentLevel {
  const clamped = Math.max(0, Math.min(100, mastery));
  // Levels are ordered by floor, so the last one whose floor is cleared is the active level.
  return OPPONENT_LEVELS.reduce(
    (active, level) => (clamped >= level.masteryFloor ? level : active),
    OPPONENT_LEVELS[0]
  );
}

export function getNextOpponentLevel(current: OpponentLevel): OpponentLevel | null {
  const index = OPPONENT_LEVELS.findIndex(l => l.name === current.name);
  return index >= 0 && index < OPPONENT_LEVELS.length - 1 ? OPPONENT_LEVELS[index + 1] : null;
}

/**
 * The next move of the opening being trained, while the game is still following it.
 * Keeps the opponent in book so the position under study actually arises on the board.
 */
export function getBookReply(bookMoves: string[], history: string[]): string | null {
  if (!bookMoves || history.length >= bookMoves.length) return null;

  for (let i = 0; i < history.length; i++) {
    if (history[i] !== bookMoves[i]) return null;
  }

  return bookMoves[history.length];
}

export interface OpponentMove {
  san: string;
  uci: string | null;
  source: 'ENGINE' | 'FALLBACK';
  /** Centipawns the opponent deliberately conceded relative to its best option. */
  concededCp: number;
  /** Candidates the decision was made from, reusable for the evaluation bar. */
  candidates: MultiPvCandidate[];
}

export async function selectOpponentMove(
  fen: string,
  level: OpponentLevel
): Promise<OpponentMove | null> {
  const candidates = await stockfishEngine.analyzePosition(fen, level.multiPv, level.searchProfile);

  if (candidates.length === 0) {
    // Engine unavailable or timed out — the training game must still continue.
    const fallback = pickLegalFallback(fen);
    return fallback
      ? { san: fallback, uci: null, source: 'FALLBACK', concededCp: 0, candidates: [] }
      : null;
  }

  const sideToMove = sideToMoveFromFen(fen);
  const moverEval = (candidate: MultiPvCandidate) =>
    toSideToMoveCp(candidate.evaluation, sideToMove);

  const best = bestCandidateForSideToMove(candidates, fen)!;
  const bestEval = moverEval(best);

  // Only moves within the level's concession budget are eligible, so weakening never becomes
  // outright self-destruction. Ordered strongest-first.
  const eligible = candidates
    .filter(c => bestEval - moverEval(c) <= level.concessionBudgetCp)
    .sort((a, b) => moverEval(b) - moverEval(a));

  const pool = eligible.length > 0 ? eligible : [best];
  const span = pool.length - 1;

  // Aim at a position in the list set by the level, with a little jitter so repeated training
  // games do not become a memorised script.
  const target = Math.round(span * level.weaknessBias);
  const jitter = span > 0 && Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) : 0;
  const chosen = pool[Math.max(0, Math.min(span, target + jitter))];

  return {
    san: chosen.move,
    uci: chosen.uci,
    source: 'ENGINE',
    concededCp: Math.max(0, Math.round(bestEval - moverEval(chosen))),
    candidates,
  };
}

function pickLegalFallback(fen: string): string | null {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves();
    return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
  } catch {
    return null;
  }
}
