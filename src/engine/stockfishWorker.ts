import { stockfishClient } from './stockfish/stockfishClient';
import { getSearchProfileConfiguration } from './stockfish/deviceCapabilities';
import { mateToCentipawns } from './stockfish/stockfishProtocol';
import { MultiPvResult, SearchProfileName } from './stockfish/types';
import { AnalysisCacheManager } from './analysisCache';
import { MultiPvCandidate } from '../chess/transpositionResolver';

export interface StockfishStatus {
  available: boolean;
  initialized: boolean;
  statusText: string;
  engineName: string;
  engineVersion: string;
  usingWasm: boolean;
}

/** Partial evaluation streamed while a search is still running. */
export interface EvaluationProgress {
  evaluationCp: number;
  mateScore: number | null;
  depth: number;
}

export interface AnalyzeOptions {
  multiPv?: number;
  profile?: SearchProfileName;
  /** Overrides the profile's Skill Level. Used to weaken the training opponent. */
  skillLevel?: number;
  /** Overrides the profile's depth target. */
  depth?: number;
  /** Overrides the profile's wall-clock ceiling. */
  movetime?: number;
  /** Called as the search deepens, for immediate evaluation-bar feedback. */
  onProgress?: (progress: EvaluationProgress) => void;
  /**
   * Set false for opponent moves: replaying a cached result would make the opponent play an
   * identical game every time, and these searches are short enough that the cache saves little.
   */
  useCache?: boolean;
}

/** Hard ceiling on a single search, so a wedged worker can never stall the training loop. */
const ANALYSIS_TIMEOUT_MS = 15000;

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
      statusText: v.engineVerified
        ? v.usingWasm
          ? 'ENGINE VERIFIED (WASM)'
          : 'ENGINE VERIFIED (ASM.JS FALLBACK)'
        : 'CURATED OPENING KNOWLEDGE',
      engineName: v.engineName || 'Stockfish 18',
      engineVersion: v.engineVersion || '18.0-stable',
      usingWasm: v.usingWasm,
    };
  }

  public analyzePosition(fen: string, options: AnalyzeOptions = {}): Promise<MultiPvCandidate[]> {
    const queued = this.chain
      .catch(() => undefined)
      .then(() => this.runAnalysis(fen, options));

    // Keep the chain alive regardless of individual outcomes.
    this.chain = queued.then(
      () => undefined,
      () => undefined
    );

    return queued;
  }

  private async runAnalysis(
    fen: string,
    options: AnalyzeOptions
  ): Promise<MultiPvCandidate[]> {
    const multiPvCount = options.multiPv ?? 3;
    const base = getSearchProfileConfiguration(options.profile ?? 'TRAINING', multiPvCount);

    const config = {
      ...base,
      depth: options.depth ?? base.depth,
      movetime: options.movetime ?? base.movetime,
      skillLevel: options.skillLevel ?? base.skillLevel,
    };

    const depth = config.depth || 14;
    // Skill level belongs in the cache key: a skill-2 result is a different answer to the same
    // question, and must never be served to the coach as if it were full strength.
    const cacheVersion = `stockfish-18-stable-sk${config.skillLevel}`;
    const useCache = options.useCache !== false;

    if (useCache) {
      const cached = await AnalysisCacheManager.get(fen, cacheVersion, depth, multiPvCount);
      if (cached && cached.bestMoves && cached.bestMoves.length > 0) {
        // Keep progress consumers in sync even on a cache hit.
        if (options.onProgress) {
          const top = cached.bestMoves[0];
          options.onProgress({
            evaluationCp: top.evaluation,
            mateScore: top.mateScore ?? null,
            depth: cached.depth,
          });
        }
        return cached.bestMoves;
      }
    }

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
        onProgress: options.onProgress,
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

          if (useCache && candidates.length > 0) {
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
                engineVersion: cacheVersion,
                bestMoves: candidates,
                timestamp: Date.now(),
              },
              cacheVersion,
              depth,
              multiPvCount
            );
          }

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
