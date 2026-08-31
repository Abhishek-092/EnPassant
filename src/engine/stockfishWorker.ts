import { stockfishClient } from './stockfish/stockfishClient';
import { getSearchProfileConfiguration } from './stockfish/deviceCapabilities';
import { mateToCentipawns } from './stockfish/stockfishProtocol';
import { MultiPvResult, SearchProfileName } from './stockfish/types';
import { AnalysisCacheManager } from './analysisCache';
import { MultiPvCandidate } from '../chess/transpositionResolver';

export interface StockfishStatus {
  available: boolean;
  initialized: boolean;
  statusText: string; // "ENGINE VERIFIED" or "CURATED OPENING KNOWLEDGE"
  engineName: string;
  engineVersion: string;
}

/** Hard ceiling on a single search, so a wedged worker can never stall the training loop. */
const ANALYSIS_TIMEOUT_MS = 20000;

class StockfishEngineService {
  /**
   * There is one Stockfish worker, and it can only search one position at a time. Requests are
   * therefore chained rather than fired concurrently: the training board and the opponent both
   * need results, and letting them race means one silently supersedes the other.
   */
  private chain: Promise<unknown> = Promise.resolve();

  public getStatus(): StockfishStatus {
    const v = stockfishClient.getVerificationStatus();
    return {
      available: v.engineVerified,
      initialized: v.uciInitialized,
      statusText: v.engineVerified ? 'ENGINE VERIFIED (Stockfish 18)' : 'CURATED OPENING KNOWLEDGE',
      engineName: v.engineName || 'Stockfish 18',
      engineVersion: v.engineVersion || '18.0-stable',
    };
  }

  public analyzePosition(
    fen: string,
    multiPvCount: number = 3,
    profileName: SearchProfileName = 'TRAINING'
  ): Promise<MultiPvCandidate[]> {
    const queued = this.chain
      .catch(() => undefined)
      .then(() => this.runAnalysis(fen, multiPvCount, profileName));

    // Keep the chain alive regardless of individual outcomes.
    this.chain = queued.then(
      () => undefined,
      () => undefined
    );

    return queued;
  }

  private async runAnalysis(
    fen: string,
    multiPvCount: number,
    profileName: SearchProfileName
  ): Promise<MultiPvCandidate[]> {
    const config = getSearchProfileConfiguration(profileName, multiPvCount);
    const depth = config.depth || 16;

    // 1. Check two-tier cache (Memory + IndexedDB)
    const cached = await AnalysisCacheManager.get(fen, 'stockfish-18-stable', depth, multiPvCount);
    if (cached && cached.bestMoves && cached.bestMoves.length > 0) {
      return cached.bestMoves;
    }

    // 2. Perform real Stockfish WASM UCI Analysis
    return new Promise<MultiPvCandidate[]>(resolve => {
      let settled = false;
      const finish = (candidates: MultiPvCandidate[]) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(candidates);
      };

      const timer = setTimeout(() => {
        stockfishClient.cancelActive();
        finish([]);
      }, ANALYSIS_TIMEOUT_MS);

      stockfishClient.analyze({
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fen,
        config,
        onComplete: (res: MultiPvResult) => {
          const candidates: MultiPvCandidate[] = res.lines.map(line => {
            const isMate = line.evaluation.type === 'mate';
            return {
              move: line.moveSan || line.moveUci,
              uci: line.moveUci,
              evaluation: isMate
                ? mateToCentipawns(line.evaluation.value)
                : line.evaluation.value,
              mateScore: isMate ? line.evaluation.value : null,
              pv: line.principalVariationSan || line.principalVariationUci,
              rank: line.rank,
            };
          });

          // Cache result for instant future lookups
          AnalysisCacheManager.set(
            fen,
            {
              fen,
              fingerprint: {
                normalizedFen: fen,
                boardHash: 'hash',
                sideToMove: fen.includes(' w ') ? 'w' : 'b',
                transpositionKey: fen.split(' ')[0],
                castlingRights: '-',
                enPassantTarget: null,
              },
              depth,
              multiPvCount,
              engineVersion: 'stockfish-18-stable',
              bestMoves: candidates,
              timestamp: Date.now(),
            },
            'stockfish-18-stable',
            depth,
            multiPvCount
          );

          finish(candidates);
        },
        onError: () => finish([]),
      });
    });
  }

  public cancelActiveAnalysis(): void {
    stockfishClient.cancelActive();
  }
}

export const stockfishEngine = new StockfishEngineService();
