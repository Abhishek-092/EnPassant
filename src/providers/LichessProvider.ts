import { Chess } from 'chess.js';
import { IGameProvider, NormalizedGame } from './GameProvider';

export class LichessProvider implements IGameProvider {
  public async connect(username: string): Promise<boolean> {
    try {
      const res = await fetch(`https://lichess.org/api/user/${encodeURIComponent(username)}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchGames(username: string, lastSyncAt: number = 0): Promise<NormalizedGame[]> {
    try {
      const res = await fetch(
        `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=15&opening=true`
      );
      if (!res.ok) return [];

      const pgnText = await res.text();
      const rawPgns = pgnText.split('\n\n\n').filter(p => p.trim().length > 0);

      const normalized: NormalizedGame[] = [];

      for (let i = 0; i < rawPgns.length; i++) {
        const pgn = rawPgns[i];
        const chess = new Chess();
        try {
          chess.loadPgn(pgn);
          const header = chess.header();
          const white = header.White || 'White';
          const black = header.Black || 'Black';
          const isWhite = white.toLowerCase() === username.toLowerCase();
          const userColor = isWhite ? 'white' : 'black';

          const site = header.Site || '';
          const externalId = site.split('/').pop() || `lichess_${i}_${Date.now()}`;
          const normalizedId = `lichess:${externalId}`;

          const resultHeader = header.Result || '*';
          let resultStr = 'Draw';
          if (resultHeader === '1-0') resultStr = userColor === 'white' ? 'Win' : 'Loss';
          if (resultHeader === '0-1') resultStr = userColor === 'black' ? 'Win' : 'Loss';

          normalized.push({
            id: normalizedId,
            platform: 'lichess',
            externalGameId: externalId,
            pgn,
            date: header.Date || new Date().toISOString().split('T')[0],
            whitePlayer: white,
            blackPlayer: black,
            userColor,
            result: resultStr,
            timeControl: header.Event || 'Lichess Game',
            openingName: header.Opening || 'Lichess Opening',
            moves: chess.history(),
          });
        } catch {
          continue;
        }
      }

      return normalized;
    } catch (err) {
      console.warn('Failed to fetch Lichess games:', err);
      return [];
    }
  }
}
