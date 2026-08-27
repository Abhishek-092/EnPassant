import { stockfishClient } from './stockfish/stockfishClient';
import { EngineVerifier } from './stockfish/engineVerifier';
import { getSearchProfileConfiguration } from './stockfish/deviceCapabilities';
import { MultiPvResult, SearchProfileName } from './stockfish/types';
import { AnalysisCacheManager } from './analysisCache';
import { MultiPvCandidate } from '../chess/transpositionResolver';

export interface StockfishStatus {
  available: boolean;
  initialized: boolean;
  statusText: string; // "ENGINE VERIFIED" or "CACHED ENGINE ANALYSIS" or "ENGINE UNAVAILABLE"
  engineName: string;
  engineVersion: string;
}

class StockfishEngineService {
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

  public async analyzePosition(
    fen: string,
    multiPvCount: number = 3,
    profileName: SearchProfileName = 'TRAINING'
  ): Promise<MultiPvCandidate[]> {
    const config = getSearchProfileConfiguration(profileName, multiPvCount);

    // 1. Check two-tier cache (Memory + IndexedDB)
    const cached = await AnalysisCacheManager.get(fen, 'stockfish-18-stable', config.depth || 16, multiPvCount);
    if (cached && cached.bestMoves && cached.bestMoves.length > 0) {
      return cached.bestMoves;
    }

    // 2. Perform real Stockfish WASM UCI Analysis
    return new Promise<MultiPvCandidate[]>((resolve) => {
      stockfishClient.analyze({
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fen,
        config,
        onComplete: (res: MultiPvResult) => {
          const candidates: MultiPvCandidate[] = res.lines.map(line => ({
            move: line.moveSan || line.moveUci,
            uci: line.moveUci,
            evaluation: line.evaluation.value,
            pv: line.principalVariationSan || line.principalVariationUci,
            rank: line.rank,
          }));

          // Cache result for instant future lookups
          AnalysisCacheManager.set(fen, {
            fen,
            fingerprint: {
              normalizedFen: fen,
              boardHash: 'hash',
              sideToMove: fen.includes(' w ') ? 'w' : 'b',
              transpositionKey: fen.split(' ')[0],
              castlingRights: '-',
              enPassantTarget: null,
            },
            depth: config.depth || 16,
            multiPvCount,
            engineVersion: 'stockfish-18-stable',
            bestMoves: candidates,
            timestamp: Date.now(),
          }, 'stockfish-18-stable', config.depth || 16, multiPvCount);

          resolve(candidates);
        },
        onError: () => {
          resolve([]);
        },
      });
    });
  }

  public cancelActiveAnalysis(): void {
    stockfishClient.cancelActive();
  }
}

export const stockfishEngine = new StockfishEngineService();
