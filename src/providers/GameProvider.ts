import { Chess } from 'chess.js';

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

export interface SyncResult {
  newGames: NormalizedGame[];
  skippedCount: number;
  lastSyncAt: number;
}

export interface IGameProvider {
  connect(username: string): Promise<boolean>;
  fetchGames(username: string, lastSyncAt?: number): Promise<NormalizedGame[]>;
}
