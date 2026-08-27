import { getPositionFingerprint } from '../chess/positionFingerprint';
import { MultiPvResult } from '../chess/transpositionResolver';
import { indexedDBStorage } from '../storage/indexedDB';

const memoryCache = new Map<string, MultiPvResult>();

export function generateCacheKey(
  fen: string,
  engineVersion: string = 'stockfish-16-wasm',
  depth: number = 12,
  multiPv: number = 3
): string {
  const fingerprint = getPositionFingerprint(fen);
  return `${fingerprint.transpositionKey}:${engineVersion}:${depth}:${multiPv}`;
}

export class AnalysisCacheManager {
  public static async get(
    fen: string,
    engineVersion: string = 'stockfish-16-wasm',
    depth: number = 12,
    multiPv: number = 3
  ): Promise<MultiPvResult | null> {
    const key = generateCacheKey(fen, engineVersion, depth, multiPv);

    // 1. Check in-memory fast cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }

    // 2. Check IndexedDB persistent cache
    const idbResult = await indexedDBStorage.getEngineAnalysis(key);
    if (idbResult) {
      memoryCache.set(key, idbResult);
      return idbResult;
    }

    return null;
  }

  public static async set(
    fen: string,
    result: MultiPvResult,
    engineVersion: string = 'stockfish-16-wasm',
    depth: number = 12,
    multiPv: number = 3
  ): Promise<void> {
    const key = generateCacheKey(fen, engineVersion, depth, multiPv);
    memoryCache.set(key, result);
    await indexedDBStorage.setEngineAnalysis(key, result);
  }

  public static clearMemoryCache(): void {
    memoryCache.clear();
  }
}
