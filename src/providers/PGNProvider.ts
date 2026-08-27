import { Chess } from 'chess.js';
import { NormalizedGame } from './GameProvider';

export class PGNProvider {
  public static parsePgn(pgnString: string, userColor: 'white' | 'black' = 'white'): NormalizedGame | null {
    try {
      const chess = new Chess();
      chess.loadPgn(pgnString);

      const header = chess.header();
      const externalId = `pgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: `pgn:${externalId}`,
        platform: 'pgn',
        externalGameId: externalId,
        pgn: pgnString,
        date: header.Date || new Date().toISOString().split('T')[0],
        whitePlayer: header.White || 'White',
        blackPlayer: header.Black || 'Black',
        userColor,
        result: header.Result || 'Draw',
        timeControl: header.Event || 'Custom PGN',
        openingName: header.Opening || 'Imported PGN',
        moves: chess.history(),
      };
    } catch {
      return null;
    }
  }
}
