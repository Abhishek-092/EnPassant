import { Chess } from 'chess.js';
import { getPositionFingerprint } from '../../chess/positionFingerprint';
import { EcoOpeningRecord } from './types';

export class EcoNormalizer {
  public static normalizeRecord(raw: Partial<EcoOpeningRecord>): EcoOpeningRecord | null {
    if (!raw.name || !raw.moves || raw.moves.length === 0) {
      return null;
    }

    const chess = new Chess();
    const validatedMoves: string[] = [];

    // Replay move sequence via chess.js for strict move validation
    try {
      for (const moveStr of raw.moves) {
        const res = chess.move(moveStr);
        if (res) {
          validatedMoves.push(res.san);
        } else {
          return null; // Reject malformed record
        }
      }
    } catch {
      return null; // Reject invalid sequence
    }

    const finalFen = chess.fen();
    const fingerprint = getPositionFingerprint(finalFen);

    const firstMove = validatedMoves[0] || 'e4';
    const isWhiteOpening = ['e4', 'd4', 'c4', 'Nf3', 'g3', 'b3', 'f4'].includes(firstMove);

    return {
      eco: raw.eco || 'A00',
      name: raw.name,
      variation: raw.variation,
      aliases: raw.aliases || [],
      moves: validatedMoves,
      fen: finalFen,
      fingerprintKey: fingerprint.transpositionKey,
      color: raw.color || (isWhiteOpening ? 'WHITE' : 'BLACK'),
      category: raw.category || 'Standard Opening',
      parentEco: raw.parentEco,
    };
  }
}
