export interface NormalizedGame {
  id: string; // `${platform}:${externalGameId}`
  platform: 'chesscom' | 'lichess' | 'pgn';
  externalGameId: string;
  pgn: string;
  date: string;
  whitePlayer: string;
  blackPlayer: string;
  userColor: 'white' | 'black';
  result: string;
  timeControl: string;
  openingName: string;
  variationName?: string;
  moves: string[];
}

export interface GameFetchOptions {
  /** Target number of games. Providers may return slightly more (whole pages). */
  limit?: number;
  /**
   * Opaque provider-specific position to continue from, returned by a previous fetch.
   * Chess.com uses a monthly-archive index; Lichess uses an `until` timestamp.
   */
  cursor?: string | null;
}

export interface GameFetchResult {
  games: NormalizedGame[];
  /** Pass back as `cursor` to fetch the next, older page. Null when the history is exhausted. */
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SyncResult {
  newGames: NormalizedGame[];
  skippedCount: number;
  lastSyncAt: number;
}

export interface IGameProvider {
  connect(username: string): Promise<boolean>;
  fetchGames(username: string, options?: GameFetchOptions): Promise<GameFetchResult>;
}
