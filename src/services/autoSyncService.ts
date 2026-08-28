import { ChessComProvider } from '@/providers/ChessComProvider';
import { LichessProvider } from '@/providers/LichessProvider';
import { analysisOrchestrator } from '@/analysis/analysisOrchestrator';

export interface AutoSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  totalSyncedGames: number;
  lastError: string | null;
}

class AutoSyncManager {
  private isSyncing = false;
  private lastSyncedUsernames = { chessCom: '', lichess: '' };
  private listeners = new Set<(status: AutoSyncStatus) => void>();

  public getStatus(): AutoSyncStatus {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('enpassant_last_sync_time') : null;
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: stored ? parseInt(stored, 10) : null,
      totalSyncedGames: 0,
      lastError: null,
    };
  }

  public subscribe(cb: (status: AutoSyncStatus) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(error: string | null = null, total = 0) {
    const status: AutoSyncStatus = {
      isSyncing: this.isSyncing,
      lastSyncedAt: Date.now(),
      totalSyncedGames: total,
      lastError: error,
    };
    this.listeners.forEach(cb => cb(status));
  }

  /**
   * Automatically synchronizes games for configured usernames if not synced recently.
   * Debounces repeated calls within 3 minutes unless forced.
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

    // Cooldown check (3 minutes cooldown unless forced or username changed)
    const now = Date.now();
    const lastSyncTime = typeof window !== 'undefined' ? localStorage.getItem('enpassant_last_sync_time') : null;
    const cooldownMs = 3 * 60 * 1000;

    const usernamesChanged =
      this.lastSyncedUsernames.chessCom !== cUser || this.lastSyncedUsernames.lichess !== lUser;

    if (!force && !usernamesChanged && lastSyncTime && now - parseInt(lastSyncTime, 10) < cooldownMs) {
      return { count: 0, error: null };
    }

    this.isSyncing = true;
    this.lastSyncedUsernames = { chessCom: cUser, lichess: lUser };
    this.notify();

    let count = 0;
    let error: string | null = null;

    try {
      if (cUser) {
        try {
          const provider = new ChessComProvider();
          const games = await provider.fetchGames(cUser);
          for (const game of games) {
            await analysisOrchestrator.analyzeGame(game);
            count++;
          }
        } catch (e: any) {
          console.warn('AutoSync Chess.com error:', e);
          error = e?.message || 'Chess.com sync failed';
        }
      }

      if (lUser) {
        try {
          const provider = new LichessProvider();
          const games = await provider.fetchGames(lUser);
          for (const game of games) {
            await analysisOrchestrator.analyzeGame(game);
            count++;
          }
        } catch (e: any) {
          console.warn('AutoSync Lichess error:', e);
          error = e?.message || 'Lichess sync failed';
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('enpassant_last_sync_time', String(Date.now()));
      }
    } finally {
      this.isSyncing = false;
      this.notify(error, count);
    }

    return { count, error };
  }
}

export const autoSyncManager = new AutoSyncManager();
