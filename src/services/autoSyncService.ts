import { ChessComProvider } from '@/providers/ChessComProvider';
import { LichessProvider } from '@/providers/LichessProvider';
import { GameFetchResult, NormalizedGame } from '@/providers/GameProvider';
import { analysisOrchestrator } from '@/analysis/analysisOrchestrator';
import { APP_CONFIG } from '@/config/appConfig';

export interface AutoSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  totalSyncedGames: number;
  lastError: string | null;
  /** True when either platform still has older games available. */
  hasMore: boolean;
}

const LAST_SYNC_KEY = 'enpassant_last_sync_time';
const CURSOR_KEY_CHESSCOM = 'enpassant_cursor_chesscom';
const CURSOR_KEY_LICHESS = 'enpassant_cursor_lichess';

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function writeStored(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

class AutoSyncManager {
  private isSyncing = false;
  private lastSyncedUsernames = { chessCom: '', lichess: '' };
  private listeners = new Set<(status: AutoSyncStatus) => void>();
  private lastError: string | null = null;
  private totalSyncedGames = 0;

  public getStatus(): AutoSyncStatus {
    const stored = readStored(LAST_SYNC_KEY);
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: stored ? parseInt(stored, 10) : null,
      totalSyncedGames: this.totalSyncedGames,
      lastError: this.lastError,
      hasMore: this.hasMoreGames(),
    };
  }

  /** True when a cursor is stored for either platform, meaning older games remain. */
  public hasMoreGames(): boolean {
    return readStored(CURSOR_KEY_CHESSCOM) !== null || readStored(CURSOR_KEY_LICHESS) !== null;
  }

  public subscribe(cb: (status: AutoSyncStatus) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(cb => cb(status));
  }

  /**
   * Imports and analyzes games. The first pass pulls a full page (50 by default) rather than a
   * token handful, so the archive is immediately useful; `loadMoreGames` walks further back.
   */
  public async autoSync(
    chessComUsername?: string,
    lichessUsername?: string,
    force = false
  ): Promise<{ count: number; error: string | null }> {
    if (this.isSyncing) return { count: 0, error: null };

    const cUser = chessComUsername?.trim() || '';
    const lUser = lichessUsername?.trim() || '';
    if (!cUser && !lUser) return { count: 0, error: null };

    const now = Date.now();
    const lastSyncTime = readStored(LAST_SYNC_KEY);
    const cooldownMs = 3 * 60 * 1000;

    const usernamesChanged =
      this.lastSyncedUsernames.chessCom !== cUser || this.lastSyncedUsernames.lichess !== lUser;

    if (!force && !usernamesChanged && lastSyncTime && now - parseInt(lastSyncTime, 10) < cooldownMs) {
      return { count: 0, error: null };
    }

    // A fresh sync restarts paging from the newest games.
    if (usernamesChanged || force) {
      writeStored(CURSOR_KEY_CHESSCOM, null);
      writeStored(CURSOR_KEY_LICHESS, null);
    }

    this.lastSyncedUsernames = { chessCom: cUser, lichess: lUser };
    return this.runSync(cUser, lUser, APP_CONFIG.sync.initialGamesPerSync, true);
  }

  /** Fetches the next, older page for whichever platforms still have history. */
  public async loadMoreGames(
    chessComUsername?: string,
    lichessUsername?: string
  ): Promise<{ count: number; error: string | null }> {
    if (this.isSyncing) return { count: 0, error: null };

    const cUser = chessComUsername?.trim() || '';
    const lUser = lichessUsername?.trim() || '';
    if (!cUser && !lUser) return { count: 0, error: null };

    return this.runSync(cUser, lUser, APP_CONFIG.sync.loadMoreBatchSize, false);
  }

  private async runSync(
    cUser: string,
    lUser: string,
    limit: number,
    isInitial: boolean
  ): Promise<{ count: number; error: string | null }> {
    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let count = 0;
    let error: string | null = null;

    try {
      if (cUser) {
        const cursor = isInitial ? null : readStored(CURSOR_KEY_CHESSCOM);
        // On a continuation with no cursor left, that platform is exhausted.
        if (isInitial || cursor !== null) {
          try {
            const provider = new ChessComProvider();
            const result = await provider.fetchGames(cUser, { limit, cursor });
            count += await this.ingest(result);
            writeStored(CURSOR_KEY_CHESSCOM, result.nextCursor);
          } catch (e: any) {
            console.warn('Sync Chess.com error:', e);
            error = e?.message || 'Chess.com sync failed';
          }
        }
      }

      if (lUser) {
        const cursor = isInitial ? null : readStored(CURSOR_KEY_LICHESS);
        if (isInitial || cursor !== null) {
          try {
            const provider = new LichessProvider();
            const result = await provider.fetchGames(lUser, { limit, cursor });
            count += await this.ingest(result);
            writeStored(CURSOR_KEY_LICHESS, result.nextCursor);
          } catch (e: any) {
            console.warn('Sync Lichess error:', e);
            error = e?.message || 'Lichess sync failed';
          }
        }
      }

      writeStored(LAST_SYNC_KEY, String(Date.now()));
    } finally {
      this.isSyncing = false;
      this.lastError = error;
      this.totalSyncedGames = count;
      this.notify();
    }

    return { count, error };
  }

  /**
   * Persists games and schedules their engine analysis. The engine work is queued rather than
   * awaited, so importing 50 games stays fast and the analysis drains in the background.
   */
  private async ingest(result: GameFetchResult): Promise<number> {
    let count = 0;
    for (const game of result.games as NormalizedGame[]) {
      await analysisOrchestrator.analyzeGame(game);
      count++;
    }
    return count;
  }
}

export const autoSyncManager = new AutoSyncManager();
