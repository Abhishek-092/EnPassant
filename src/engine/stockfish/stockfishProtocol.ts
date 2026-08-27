import { Chess } from 'chess.js';
import { EngineLine, EngineEvaluation } from './types';

export function parseUciInfoLine(
  line: string,
  fen: string
): Partial<EngineLine> | null {
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

  const moveUci = pvTokens[0];
  const pvSan: string[] = [];

  // Parse PV tokens into SAN moves using chess.js
  try {
    const chess = new Chess(fen);
    for (const uciMove of pvTokens) {
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove.substring(4, 5) : undefined;
      const res = chess.move({ from, to, promotion });
      if (res) {
        pvSan.push(res.san);
      } else {
        break;
      }
    }
  } catch {
    // If parsing fails, fall back to UCI string
  }

  return {
    rank,
    moveUci,
    moveSan: pvSan[0] || moveUci,
    evaluation,
    principalVariationUci: pvTokens,
    principalVariationSan: pvSan,
    depth,
    selDepth,
    nodes,
    timeMs,
  };
}
