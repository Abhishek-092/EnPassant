import { getPositionFingerprint, PositionFingerprint } from './positionFingerprint';

export interface MultiPvCandidate {
  move: string;              // SAN format e.g. "...c5" or "c5"
  uci: string;               // UCI format e.g. "c7c5"
  evaluation: number;        // Centipawns, White's perspective (positive = White better)
  mateScore?: number | null; // Mate in N moves, White's perspective
  pv: string[];              // Principal variation moves
  rank: number;              // 1-indexed rank from engine
}

export interface MultiPvResult {
  fen: string;
  fingerprint: PositionFingerprint;
  depth: number;
  multiPvCount: number;
  engineVersion: string;
  bestMoves: MultiPvCandidate[];
  timestamp: number;
  isCuratedFallback?: boolean;
}

export interface PositionNode {
  id: string;
  fen: string;
  normalizedFen: string;
  positionFingerprint: PositionFingerprint;
  openingIds: string[];
  openingNames: string[];
  variationNames: string[];
  parentMovePaths: string[][]; // Alternative move paths reaching this exact position
  engineAnalysis?: MultiPvResult;
}

class TranspositionResolver {
  private positionMap = new Map<string, PositionNode>();

  public resolvePosition(fen: string, moveHistory: string[] = []): PositionNode {
    const fingerprint = getPositionFingerprint(fen);
    const key = fingerprint.transpositionKey;

    let node = this.positionMap.get(key);

    if (!node) {
      node = {
        id: `pos_${fingerprint.boardHash}`,
        fen,
        normalizedFen: fingerprint.normalizedFen,
        positionFingerprint: fingerprint,
        openingIds: [],
        openingNames: [],
        variationNames: [],
        parentMovePaths: [],
      };
      this.positionMap.set(key, node);
    }

    if (moveHistory.length > 0) {
      const pathStr = moveHistory.join(' ');
      const exists = node.parentMovePaths.some(p => p.join(' ') === pathStr);
      if (!exists) {
        node.parentMovePaths.push([...moveHistory]);
      }
    }

    return node;
  }

  public getPositionNode(fen: string): PositionNode | undefined {
    const fingerprint = getPositionFingerprint(fen);
    return this.positionMap.get(fingerprint.transpositionKey);
  }

  public registerOpeningMetadata(
    fen: string,
    openingId: string,
    openingName: string,
    variationName?: string
  ): PositionNode {
    const node = this.resolvePosition(fen);

    if (!node.openingIds.includes(openingId)) {
      node.openingIds.push(openingId);
    }
    if (!node.openingNames.includes(openingName)) {
      node.openingNames.push(openingName);
    }
    if (variationName && !node.variationNames.includes(variationName)) {
      node.variationNames.push(variationName);
    }

    return node;
  }

  public clear() {
    this.positionMap.clear();
  }
}

export const transpositionResolver = new TranspositionResolver();
