import { Chess } from 'chess.js';
import { GameFetchOptions, GameFetchResult, IGameProvider, NormalizedGame } from './GameProvider';

export class ChessComProvider implements IGameProvider {
  public async connect(username: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Chess.com exposes games as monthly archives, newest last. Walks backwards from the requested
   * archive, taking whole months until the target count is met — a single month is often fewer
   * than 50 games, so reading only the latest archive (the previous behaviour) truncated history.
   *
   * The cursor is the index of the next, older archive to read.
   */
  public async fetchGames(
    username: string,
    options: GameFetchOptions = {}
  ): Promise<GameFetchResult> {
    const limit = options.limit ?? 50;
    const empty: GameFetchResult = { games: [], nextCursor: null, hasMore: false };

    try {
      const archivesRes = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`
      );
      if (!archivesRes.ok) return empty;

      const { archives } = await archivesRes.json();
      if (!archives || !Array.isArray(archives) || archives.length === 0) return empty;

      let index =
        options.cursor !== null && options.cursor !== undefined
          ? parseInt(options.cursor, 10)
          : archives.length - 1;

      if (Number.isNaN(index) || index < 0) return empty;
      index = Math.min(index, archives.length - 1);

      const collected: NormalizedGame[] = [];

      while (index >= 0 && collected.length < limit) {
        const gamesRes = await fetch(archives[index]);
        index--;

        if (!gamesRes.ok) continue;

        const { games } = await gamesRes.json();
        if (!games || !Array.isArray(games)) continue;

        // Newest first within the month.
        for (const game of [...games].reverse()) {
          const normalized = this.normalizeGame(game, username);
          if (normalized) collected.push(normalized);
        }
      }

      return {
        games: collected,
        nextCursor: index >= 0 ? String(index) : null,
        hasMore: index >= 0,
      };
    } catch (err) {
      console.warn('Failed to fetch Chess.com games:', err);
      return empty;
    }
  }

  private normalizeGame(game: any, username: string): NormalizedGame | null {
    try {
      const gameId = game.url ? game.url.split('/').pop() : String(game.end_time);
      const externalId = gameId || `chesscom_${game.end_time ?? Date.now()}`;

      const isWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
      const userColor: 'white' | 'black' = isWhite ? 'white' : 'black';

      const pgn = game.pgn || '';
      const moves = this.extractMovesFromPgn(pgn);

      return {
        id: `chesscom:${externalId}`,
        platform: 'chesscom',
        externalGameId: externalId,
        pgn,
        date: game.end_time
          ? new Date(game.end_time * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        whitePlayer: game.white?.username || 'White',
        blackPlayer: game.black?.username || 'Black',
        userColor,
        result: this.determineResult(game, userColor),
        timeControl: game.time_class || 'blitz',
        openingName: game.eco ? `ECO ${String(game.eco).split('/').pop()}` : 'Chess.com Opening',
        moves,
      };
    } catch {
      return null;
    }
  }

  private determineResult(game: any, userColor: 'white' | 'black'): string {
    const userRes = userColor === 'white' ? game.white?.result : game.black?.result;
    if (userRes === 'win') return 'Win';
    if (
      userRes === 'agreed' ||
      userRes === 'repetition' ||
      userRes === 'stalemate' ||
      userRes === 'insufficient' ||
      userRes === '50move' ||
      userRes === 'timevsinsufficient'
    ) {
      return 'Draw';
    }
    return 'Loss';
  }

  private extractMovesFromPgn(pgn: string): string[] {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      return chess.history();
    } catch {
      return [];
    }
  }
}
