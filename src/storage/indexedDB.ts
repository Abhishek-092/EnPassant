import { openDB, IDBPDatabase } from 'idb';
import { MultiPvResult } from '../chess/transpositionResolver';

const DB_NAME = 'OpeningForgeDB';
const DB_VERSION = 1;
const STORE_ENGINE_CACHE = 'engine_analysis_cache';
const STORE_GAMES = 'games_cache';
const STORE_MISTAKES = 'user_mistakes';
const STORE_PROGRESS = 'opening_progress';

export interface CachedGame {
  id: string;
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
  analyzed: boolean;
  importedAt: number;
}

export interface UserMistakeRecord {
  id: string;
  gameId: string;
  fen: string;
  userMove: string;
  recommendedMove: string;
  category: 'CENTER_CONTROL' | 'PAWN_BREAK' | 'DEVELOPMENT' | 'KING_SAFETY' | 'PIECE_ACTIVITY' | 'WEAK_SQUARES' | 'TACTICAL_THREAT';
  openingName: string;
  variationName?: string;
  evalLoss: number;
  createdAt: number;
  reviewCount: number;
  nextReviewAt: number;
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private getDB(): Promise<IDBPDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is only available in browser environment'));
    }
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_ENGINE_CACHE)) {
            db.createObjectStore(STORE_ENGINE_CACHE, { keyPath: 'cacheKey' });
          }
          if (!db.objectStoreNames.contains(STORE_GAMES)) {
            const store = db.createObjectStore(STORE_GAMES, { keyPath: 'id' });
            store.createIndex('platform', 'platform');
            store.createIndex('importedAt', 'importedAt');
          }
          if (!db.objectStoreNames.contains(STORE_MISTAKES)) {
            const store = db.createObjectStore(STORE_MISTAKES, { keyPath: 'id' });
            store.createIndex('category', 'category');
            store.createIndex('nextReviewAt', 'nextReviewAt');
          }
          if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
            db.createObjectStore(STORE_PROGRESS, { keyPath: 'openingId' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  // --- Engine Analysis Cache ---
  public async getEngineAnalysis(cacheKey: string): Promise<MultiPvResult | null> {
    try {
      const db = await this.getDB();
      const record = await db.get(STORE_ENGINE_CACHE, cacheKey);
      return record ? record.data : null;
    } catch {
      return null;
    }
  }

  public async setEngineAnalysis(cacheKey: string, data: MultiPvResult): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(STORE_ENGINE_CACHE, { cacheKey, data, updatedAt: Date.now() });
    } catch (e) {
      console.warn('Failed to save engine analysis to IndexedDB:', e);
    }
  }

  // --- Games Cache ---
  public async getGames(): Promise<CachedGame[]> {
    try {
      const db = await this.getDB();
      return await db.getAll(STORE_GAMES);
    } catch {
      return [];
    }
  }

  public async saveGame(game: CachedGame): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(STORE_GAMES, game);
    } catch (e) {
      console.warn('Failed to save game to IndexedDB:', e);
    }
  }

  public async saveGames(games: CachedGame[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_GAMES, 'readwrite');
      await Promise.all(games.map(g => tx.store.put(g)));
      await tx.done;
    } catch (e) {
      console.warn('Failed to bulk save games to IndexedDB:', e);
    }
  }

  // --- Personal Mistakes ---
  public async getMistakes(): Promise<UserMistakeRecord[]> {
    try {
      const db = await this.getDB();
      return await db.getAll(STORE_MISTAKES);
    } catch {
      return [];
    }
  }

  public async saveMistake(mistake: UserMistakeRecord): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(STORE_MISTAKES, mistake);
    } catch (e) {
      console.warn('Failed to save mistake to IndexedDB:', e);
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage();
