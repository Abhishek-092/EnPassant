import { Chess } from 'chess.js';
import { IGameProvider, NormalizedGame } from './GameProvider';

export class ChessComProvider implements IGameProvider {
  public async connect(username: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchGames(username: string, lastSyncAt: number = 0): Promise<NormalizedGame[]> {
    try {
      const archivesRes = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`
      );
      if (!archivesRes.ok) return [];

      const { archives } = await archivesRes.json();
      if (!archives || !Array.isArray(archives) || archives.length === 0) return [];

      // Fetch the most recent archive
      const latestArchiveUrl = archives[archives.length - 1];
      const gamesRes = await fetch(latestArchiveUrl);
      if (!gamesRes.ok) return [];

      const { games } = await gamesRes.json();
      if (!games || !Array.isArray(games)) return [];

      const normalized: NormalizedGame[] = [];

      for (const game of games.slice(-15)) { // Process latest 15 games
        const gameId = game.url ? game.url.split('/').pop() : String(game.end_time);
        const externalId = gameId || `chesscom_${Date.now()}`;
        const normalizedId = `chesscom:${externalId}`;

        const isWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
        const userColor = isWhite ? 'white' : 'black';

        // Extract moves array from PGN or FEN
        const pgn = game.pgn || '';
        const moves = this.extractMovesFromPgn(pgn);

        normalized.push({
          id: normalizedId,
          platform: 'chesscom',
          externalGameId: externalId,
          pgn,
          date: game.end_time ? new Date(game.end_time * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          whitePlayer: game.white?.username || 'White',
          blackPlayer: game.black?.username || 'Black',
          userColor,
          result: this.determineResult(game, userColor),
          timeControl: game.time_class || 'blitz',
          openingName: game.eco ? `ECO ${game.eco}` : 'Chess.com Opening',
          moves,
        });
      }

      return normalized;
    } catch (err) {
      console.warn('Failed to fetch Chess.com games:', err);
      return [];
    }
  }

  private determineResult(game: any, userColor: 'white' | 'black'): string {
    const userRes = userColor === 'white' ? game.white?.result : game.black?.result;
    if (userRes === 'win') return 'Win';
    if (userRes === 'agreed' || userRes === 'repetition' || userRes === 'stalemate') return 'Draw';
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
