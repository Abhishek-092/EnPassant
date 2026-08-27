import { Chess } from 'chess.js';
import { OPENINGS_DATABASE, OpeningDefinition, OpeningVariation } from '../openings/database';

export interface OpeningDetectionResult {
  opening: OpeningDefinition | null;
  variation: OpeningVariation | null;
  matchDepth: number; // Move count matched
  isInTheory: boolean;
  firstDeviationMoveIndex: number | null;
  theoryExitFen: string | null;
}

export function detectOpeningFromMoves(moveHistory: string[]): OpeningDetectionResult {
  let bestOpening: OpeningDefinition | null = null;
  let bestVariation: OpeningVariation | null = null;
  let maxMatchedMoves = 0;

  for (const opening of OPENINGS_DATABASE) {
    // Check main opening starting moves
    let matchedOpeningCount = 0;
    for (let i = 0; i < opening.startingMoves.length; i++) {
      if (i < moveHistory.length && moveHistory[i] === opening.startingMoves[i]) {
        matchedOpeningCount++;
      } else {
        break;
      }
    }

    if (matchedOpeningCount > maxMatchedMoves) {
      maxMatchedMoves = matchedOpeningCount;
      bestOpening = opening;
    }

    // Check detailed variations
    for (const variation of opening.variations) {
      let matchedVarCount = 0;
      for (let i = 0; i < variation.moves.length; i++) {
        if (i < moveHistory.length && moveHistory[i] === variation.moves[i]) {
          matchedVarCount++;
        } else {
          break;
        }
      }

      if (matchedVarCount > maxMatchedMoves) {
        maxMatchedMoves = matchedVarCount;
        bestOpening = opening;
        bestVariation = variation;
      }
    }
  }

  const isInTheory = moveHistory.length <= maxMatchedMoves;
  const firstDeviationMoveIndex = isInTheory ? null : maxMatchedMoves;

  // Replay moves to calculate theory exit FEN
  let theoryExitFen: string | null = null;
  if (firstDeviationMoveIndex !== null && firstDeviationMoveIndex > 0) {
    try {
      const chess = new Chess();
      for (let i = 0; i < firstDeviationMoveIndex; i++) {
        chess.move(moveHistory[i]);
      }
      theoryExitFen = chess.fen();
    } catch {
      theoryExitFen = null;
    }
  }

  return {
    opening: bestOpening,
    variation: bestVariation,
    matchDepth: maxMatchedMoves,
    isInTheory,
    firstDeviationMoveIndex,
    theoryExitFen,
  };
}
