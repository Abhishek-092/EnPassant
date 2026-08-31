import { Chess } from 'chess.js';
import { stockfishEngine } from './stockfishWorker';
import { MultiPvCandidate } from '../chess/transpositionResolver';
import { engineLevelForPosition, GamePhase, PhaseAdjustedLevel } from './eloLevels';

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
  level: PhaseAdjustedLevel;
  /** Top line of the search, reusable for the evaluation bar. */
  candidates: MultiPvCandidate[];
}

/**
 * Picks the opponent's move at the given rating.
 *
 * MultiPV 1 only: strength comes from Stockfish's own `Skill Level`, which introduces controlled
 * error inside the search. That is both stronger pedagogy than hand-picking a worse move from a
 * candidate list (the resulting play stays coherent) and several times faster, since the engine
 * is not asked to resolve multiple lines.
 */
export async function selectOpponentMove(
  fen: string,
  baseElo: number,
  onProgress?: (progress: { evaluationCp: number; mateScore: number | null }) => void
): Promise<OpponentMove | null> {
  const level = engineLevelForPosition(baseElo, fen);

  const candidates = await stockfishEngine.analyzePosition(fen, {
    multiPv: 1,
    profile: 'FAST',
    skillLevel: level.skill,
    depth: level.depth,
    movetime: level.movetime,
    useCache: false,
    onProgress: onProgress
      ? progress =>
          onProgress({ evaluationCp: progress.evaluationCp, mateScore: progress.mateScore })
      : undefined,
  });

  if (candidates.length === 0) {
    // Engine unavailable or timed out — the training game must still continue.
    const fallback = pickLegalFallback(fen);
    return fallback
      ? { san: fallback, uci: null, source: 'FALLBACK', level, candidates: [] }
      : null;
  }

  const chosen = candidates[0];
  return {
    san: chosen.move,
    uci: chosen.uci,
    source: 'ENGINE',
    level,
    candidates,
  };
}

export function describePhase(phase: GamePhase): string {
  switch (phase) {
    case 'OPENING':
      return 'Opening';
    case 'MIDDLEGAME':
      return 'Middlegame';
    case 'ENDGAME':
      return 'Endgame';
  }
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
