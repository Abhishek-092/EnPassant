import { Chess } from 'chess.js';
import { EngineLine, EngineEvaluation } from './types';

/**
 * Projects a mate score onto the centipawn scale so evaluations stay sortable and the
 * evaluation bar stays saturated. Shorter mates rank above longer ones, and the sign is
 * preserved: mate in 3 for White -> +9970, mate in 3 for Black -> -9970.
 */
export function mateToCentipawns(mateInMoves: number): number {
  return mateInMoves >= 0 ? 10000 - mateInMoves * 10 : -10000 - mateInMoves * 10;
}

/**
 * Parses a UCI `info` line into raw engine data.
 *
 * Deliberately does NOT convert the principal variation to SAN. A depth-16 MultiPV-3 search emits
 * well over a hundred info lines, and replaying every PV through chess.js on each one costs more
 * main-thread time than the search itself. SAN conversion happens once, at completion, via
 * `attachSanToLine`.
 */
export function parseUciInfoLine(line: string, fen: string): Partial<EngineLine> | null {
  if (!line.startsWith('info') || !line.includes('pv')) {
    return null;
  }

  const tokens = line.split(/\s+/);
  let depth = 0;
  let selDepth: number | undefined;
  let rank = 1;
  let scoreCp: number | undefined;
  let scoreMate: number | undefined;
  let pvTokens: string[] = [];
  let nodes: number | undefined;
  let timeMs: number | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === 'depth' && i + 1 < tokens.length) {
      depth = parseInt(tokens[i + 1], 10);
    } else if (token === 'seldepth' && i + 1 < tokens.length) {
      selDepth = parseInt(tokens[i + 1], 10);
    } else if (token === 'multipv' && i + 1 < tokens.length) {
      rank = parseInt(tokens[i + 1], 10);
    } else if (token === 'cp' && i + 1 < tokens.length) {
      scoreCp = parseInt(tokens[i + 1], 10);
    } else if (token === 'mate' && i + 1 < tokens.length) {
      scoreMate = parseInt(tokens[i + 1], 10);
    } else if (token === 'nodes' && i + 1 < tokens.length) {
      nodes = parseInt(tokens[i + 1], 10);
    } else if (token === 'time' && i + 1 < tokens.length) {
      timeMs = parseInt(tokens[i + 1], 10);
    } else if (token === 'pv') {
      pvTokens = tokens.slice(i + 1);
      break;
    }
  }

  if (pvTokens.length === 0) return null;

  // Stockfish outputs score relative to side-to-move.
  // Normalize strictly to White's perspective (positive = White advantage)
  const isBlackToMove = fen.includes(' b ');
  let evalValue = 0;
  let evalType: 'centipawn' | 'mate' = 'centipawn';

  if (scoreMate !== undefined) {
    evalType = 'mate';
    evalValue = isBlackToMove ? -scoreMate : scoreMate;
  } else if (scoreCp !== undefined) {
    evalType = 'centipawn';
    evalValue = isBlackToMove ? -scoreCp : scoreCp;
  }

  const evaluation: EngineEvaluation = {
    type: evalType,
    value: evalValue,
  };

  return {
    rank,
    moveUci: pvTokens[0],
    moveSan: undefined,
    evaluation,
    principalVariationUci: pvTokens,
    principalVariationSan: undefined,
    depth,
    selDepth,
    nodes,
    timeMs,
  };
}

/**
 * Converts a line's UCI principal variation into SAN. Called once per line when a search
 * completes, not per info line.
 *
 * `maxPlies` bounds the work: the coach shows only the first few moves of a line, so replaying a
 * 30-ply PV is wasted effort.
 */
export function attachSanToLine(line: EngineLine, fen: string, maxPlies = 8): EngineLine {
  const pvSan: string[] = [];

  try {
    const chess = new Chess(fen);
    for (const uciMove of line.principalVariationUci.slice(0, maxPlies)) {
      const result = chess.move({
        from: uciMove.substring(0, 2),
        to: uciMove.substring(2, 4),
        promotion: uciMove.length > 4 ? uciMove.substring(4, 5) : undefined,
      });
      if (!result) break;
      pvSan.push(result.san);
    }
  } catch {
    // Fall back to UCI notation if the line cannot be replayed.
  }

  return {
    ...line,
    moveSan: pvSan[0] || line.moveUci,
    principalVariationSan: pvSan.length > 0 ? pvSan : line.principalVariationUci,
  };
}
