import { Chess } from 'chess.js';

export type FeatureType =
  | 'PAWN_CHAIN'
  | 'ISOLATED_PAWN'
  | 'PASSED_PAWN'
  | 'OPEN_FILE'
  | 'SEMI_OPEN_FILE'
  | 'KNIGHT_OUTPOST'
  | 'BISHOP_PAIR'
  | 'DEVELOPMENT_LEAD'
  | 'KING_SAFETY_SHIELD'
  | 'SPACE_ADVANTAGE'
  | 'HANGING_PIECE'
  | 'PINNED_PIECE';

export interface DetectedFeature {
  type: FeatureType;
  confidence: number; // 0 to 100
  side: 'WHITE' | 'BLACK';
  squares: string[];
  pieces: string[];
  evidence: string[];
}

export class FeatureExtractor {
  public static extractFeatures(fen: string): DetectedFeature[] {
    const chess = new Chess(fen);
    const board = chess.board();
    const features: DetectedFeature[] = [];

    let whitePawnsInCenter = 0;
    let blackPawnsInCenter = 0;
    const openFiles: string[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          // Check central pawn presence
          if (piece.type === 'p') {
            const square = `${String.fromCharCode(97 + c)}${8 - r}`;
            if (['d4', 'e4'].includes(square) && piece.color === 'w') whitePawnsInCenter++;
            if (['d5', 'e5'].includes(square) && piece.color === 'b') blackPawnsInCenter++;
          }
        }
      }
    }

    // 1. Space Advantage Feature
    if (whitePawnsInCenter >= 2) {
      features.push({
        type: 'SPACE_ADVANTAGE',
        confidence: 90,
        side: 'WHITE',
        squares: ['d4', 'e4'],
        pieces: ['P'],
        evidence: ['White controls central squares d4 and e4 with pawns.'],
      });
    } else if (blackPawnsInCenter >= 2) {
      features.push({
        type: 'SPACE_ADVANTAGE',
        confidence: 90,
        side: 'BLACK',
        squares: ['d5', 'e5'],
        pieces: ['p'],
        evidence: ['Black controls central squares d5 and e5 with pawns.'],
      });
    }

    // 2. King Shield Feature
    const isWhiteCastled = !chess.fen().includes('K') || chess.fen().includes('KQ') === false;
    if (isWhiteCastled) {
      features.push({
        type: 'KING_SAFETY_SHIELD',
        confidence: 85,
        side: 'WHITE',
        squares: ['g1', 'f2', 'g2', 'h2'],
        pieces: ['K', 'P'],
        evidence: ['White has castled into a safe king pawn shield.'],
      });
    }

    return features;
  }
}
