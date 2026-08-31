import { Chess } from 'chess.js';
import { GameFetchOptions, GameFetchResult, IGameProvider, NormalizedGame } from './GameProvider';

export class LichessProvider implements IGameProvider {
  public async connect(username: string): Promise<boolean> {
    try {
      const res = await fetch(`https://lichess.org/api/user/${encodeURIComponent(username)}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Lichess streams games newest-first and pages with `until`, so the cursor is the timestamp of
   * the oldest game seen so far.
   */
  public async fetchGames(
    username: string,
    options: GameFetchOptions = {}
  ): Promise<GameFetchResult> {
    const limit = options.limit ?? 50;
    const empty: GameFetchResult = { games: [], nextCursor: null, hasMore: false };

    try {
      const params = new URLSearchParams({
        max: String(limit),
        opening: 'true',
      });
      if (options.cursor) params.set('until', options.cursor);

      const res = await fetch(
        `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params.toString()}`
      );
      if (!res.ok) return empty;

      const pgnText = await res.text();
      const rawPgns = pgnText.split('\n\n\n').filter(p => p.trim().length > 0);

      const normalized: NormalizedGame[] = [];
      let oldestTimestamp: number | null = null;

      for (let i = 0; i < rawPgns.length; i++) {
        const pgn = rawPgns[i];
        const chess = new Chess();
        try {
          chess.loadPgn(pgn);
          const header = chess.header();
          const white = header.White || 'White';
          const black = header.Black || 'Black';
          const isWhite = white.toLowerCase() === username.toLowerCase();
          const userColor: 'white' | 'black' = isWhite ? 'white' : 'black';

          const site = header.Site || '';
          const externalId = site.split('/').pop() || `lichess_${i}_${Date.now()}`;

          const resultHeader = header.Result || '*';
          let resultStr = 'Draw';
          if (resultHeader === '1-0') resultStr = userColor === 'white' ? 'Win' : 'Loss';
          if (resultHeader === '0-1') resultStr = userColor === 'black' ? 'Win' : 'Loss';

          const timestamp = this.parseTimestamp(header);
          if (timestamp !== null) {
            oldestTimestamp =
              oldestTimestamp === null ? timestamp : Math.min(oldestTimestamp, timestamp);
          }

          normalized.push({
            id: `lichess:${externalId}`,
            platform: 'lichess',
            externalGameId: externalId,
            pgn,
            date: header.UTCDate?.replace(/\./g, '-') || header.Date || new Date().toISOString().split('T')[0],
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

      // A full page suggests more history behind it; a short page means we reached the end.
      const hasMore = normalized.length >= limit && oldestTimestamp !== null;

      return {
        games: normalized,
        nextCursor: hasMore && oldestTimestamp !== null ? String(oldestTimestamp - 1000) : null,
        hasMore,
      };
    } catch (err) {
      console.warn('Failed to fetch Lichess games:', err);
      return empty;
    }
  }

  /** Milliseconds from the PGN's UTCDate/UTCTime headers, for `until` paging. */
  private parseTimestamp(header: Record<string, string | undefined>): number | null {
    const date = header.UTCDate || header.Date;
    if (!date) return null;

    const iso = `${date.replace(/\./g, '-')}T${header.UTCTime || '00:00:00'}Z`;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
