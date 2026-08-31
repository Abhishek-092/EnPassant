export interface EngineMetadata {
  name: string;
  version: string;
  build: string;
  networkVersion?: string;
}

export interface EngineEvaluation {
  type: 'centipawn' | 'mate';
  value: number; // Normalized strictly to White's perspective (positive = White advantage)
}

export interface EngineLine {
  rank: number;
  moveUci: string;
  moveSan?: string;
  evaluation: EngineEvaluation;
  principalVariationUci: string[];
  principalVariationSan?: string[];
  depth: number;
  selDepth?: number;
  nodes?: number;
  timeMs?: number;
}

export interface MultiPvResult {
  fen: string;
  fingerprintKey: string;
  bestMove: string;
  lines: EngineLine[];
  depth: number;
  engineMetadata: EngineMetadata;
  timestamp: number;
  searchProfile: 'FAST' | 'TRAINING' | 'DEEP' | 'MAXIMUM';
}

export interface EngineVerificationState {
  loaded: boolean;
  uciInitialized: boolean;
  ready: boolean;
  analyzedPosition: boolean;
  engineVerified: boolean;
  engineName?: string;
  engineVersion?: string;
  error?: string | null;
}

export type SearchProfileName = 'FAST' | 'TRAINING' | 'DEEP' | 'MAXIMUM';

export interface EngineConfiguration {
  searchMode: SearchProfileName;
  depth?: number;
  nodes?: number;
  /** Wall-clock ceiling. Combined with depth, the search stops at whichever arrives first. */
  movetime?: number;
  multiPv: number;
  threads: number;
  hash: number;
  /** Stockfish `Skill Level` (0-20). 20 is full strength; lower introduces controlled error. */
  skillLevel: number;
}
