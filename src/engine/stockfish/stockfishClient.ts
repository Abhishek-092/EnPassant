import { attachSanToLine, parseUciInfoLine } from './stockfishProtocol';
import { EngineLine, MultiPvResult, EngineMetadata, EngineConfiguration } from './types';
import { getPositionFingerprint } from '../../chess/positionFingerprint';

export interface AnalysisRequest {
  id: string;
  fen: string;
  config: EngineConfiguration;
  onComplete: (result: MultiPvResult) => void;
  onError: (err: any) => void;
  /**
   * Fired as the search deepens, so an evaluation bar can start moving within a few milliseconds
   * instead of waiting for the final `bestmove`. Carries only the top line and no SAN conversion.
   */
  onProgress?: (partial: { evaluationCp: number; mateScore: number | null; depth: number }) => void;
}

/** Detects real WebAssembly support, so we can avoid the much slower asm.js fallback build. */
function supportsWebAssembly(): boolean {
  try {
    return (
      typeof WebAssembly === 'object' &&
      typeof WebAssembly.validate === 'function' &&
      WebAssembly.validate(Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
    );
  } catch {
    return false;
  }
}

export class StockfishClient {
  private worker: Worker | null = null;
  private isLoaded = false;
  private isUciOk = false;
  private isReady = false;
  private activeRequest: AnalysisRequest | null = null;
  private currentLinesMap = new Map<number, EngineLine>();
  private lastReportedDepth = 0;
  private usingWasm = false;

  /** Last values pushed via `setoption`, so unchanged options are not re-sent before every search. */
  private appliedOptions = { multiPv: -1, threads: -1, hash: -1, skillLevel: -1 };

  private engineMetadata: EngineMetadata = {
    name: 'Stockfish 18',
    version: '18.0-stable',
    build: 'official-wasm',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
    }
  }

  private initWorker() {
    // Prefer the WebAssembly build. `stockfish.js` in /public is the asm.js fallback and is
    // several times slower, which is very visible on an interactive board.
    this.startWorker(supportsWebAssembly() ? '/stockfish.wasm.js' : '/stockfish.js');
  }

  private startWorker(scriptPath: string) {
    try {
      this.usingWasm = scriptPath.includes('wasm');

      const worker = new Worker(scriptPath);
      this.worker = worker;
      this.isLoaded = true;
      this.isUciOk = false;
      this.isReady = false;
      this.appliedOptions = { multiPv: -1, threads: -1, hash: -1, skillLevel: -1 };
      this.engineMetadata = {
        ...this.engineMetadata,
        build: this.usingWasm ? 'wasm' : 'asmjs-fallback',
      };

      worker.onmessage = (e: MessageEvent) => {
        this.handleMessage(String(e.data));
      };

      worker.onerror = err => {
        console.warn(`Stockfish worker error (${scriptPath}):`, err);

        // If the WASM build never came up, fall back to asm.js rather than leaving the app
        // with no engine at all.
        if (this.usingWasm && !this.isReady) {
          worker.terminate();
          this.worker = null;
          this.startWorker('/stockfish.js');
          return;
        }

        if (this.activeRequest) {
          const failed = this.activeRequest;
          this.activeRequest = null;
          failed.onError(err);
        }
      };

      // UCI initialization handshake
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (err) {
      console.warn(`Failed to start Stockfish worker (${scriptPath}):`, err);

      if (scriptPath !== '/stockfish.js') {
        this.startWorker('/stockfish.js');
        return;
      }
      this.isLoaded = false;
    }
  }

  public getVerificationStatus() {
    return {
      loaded: this.isLoaded,
      uciInitialized: this.isUciOk,
      ready: this.isReady,
      engineVerified: this.isLoaded && this.isUciOk && this.isReady,
      engineName: this.engineMetadata.name,
      engineVersion: this.engineMetadata.version,
      build: this.engineMetadata.build,
      usingWasm: this.usingWasm,
    };
  }

  private sendCommand(cmd: string) {
    if (this.worker && this.isLoaded) {
      this.worker.postMessage(cmd);
    }
  }

  private handleMessage(line: string) {
    const trimmed = line.trim();

    if (trimmed === 'uciok') {
      this.isUciOk = true;
      this.sendCommand('isready');
      return;
    }

    if (trimmed === 'readyok') {
      this.isReady = true;
      return;
    }

    const request = this.activeRequest;
    if (!request) return;

    // Parse info lines
    if (trimmed.startsWith('info ') && trimmed.includes(' pv ')) {
      const parsedLine = parseUciInfoLine(trimmed, request.fen);
      if (!parsedLine || !parsedLine.rank) return;

      this.currentLinesMap.set(parsedLine.rank, parsedLine as EngineLine);

      // Stream the top line upward as depth advances so the UI can paint immediately.
      if (
        request.onProgress &&
        parsedLine.rank === 1 &&
        (parsedLine.depth ?? 0) > this.lastReportedDepth
      ) {
        this.lastReportedDepth = parsedLine.depth ?? 0;
        const evaluation = parsedLine.evaluation!;
        request.onProgress({
          evaluationCp: evaluation.type === 'mate' ? 0 : evaluation.value,
          mateScore: evaluation.type === 'mate' ? evaluation.value : null,
          depth: this.lastReportedDepth,
        });
      }
      return;
    }

    // Parse bestmove
    if (trimmed.startsWith('bestmove')) {
      const parts = trimmed.split(/\s+/);
      const bestMoveUci = parts[1];

      // SAN conversion happens once, here, rather than on every info line.
      const lines = Array.from(this.currentLinesMap.values())
        .sort((a, b) => a.rank - b.rank)
        .map(engineLine => attachSanToLine(engineLine, request.fen));

      const fingerprint = getPositionFingerprint(request.fen);

      const result: MultiPvResult = {
        fen: request.fen,
        fingerprintKey: fingerprint.transpositionKey,
        bestMove: bestMoveUci,
        lines,
        depth: request.config.depth || 16,
        engineMetadata: this.engineMetadata,
        timestamp: Date.now(),
        searchProfile: request.config.searchMode,
      };

      this.activeRequest = null;
      this.currentLinesMap.clear();
      this.lastReportedDepth = 0;
      request.onComplete(result);
    }
  }

  public analyze(request: AnalysisRequest): void {
    // Invalidate the previous request. It must be told it lost the worker, otherwise its
    // promise never settles and whatever was awaiting it hangs forever.
    if (this.activeRequest) {
      const superseded = this.activeRequest;
      this.activeRequest = null;
      this.currentLinesMap.clear();
      this.sendCommand('stop');
      superseded.onError(new Error('Analysis superseded by a newer request'));
    }

    this.activeRequest = request;
    this.currentLinesMap.clear();
    this.lastReportedDepth = 0;

    const config = request.config;

    // Only push options that actually changed. Skill Level in particular must always be correct:
    // leaving a weakened value set from an opponent move would corrupt the coach's "best move".
    if (config.multiPv !== this.appliedOptions.multiPv) {
      this.sendCommand(`setoption name MultiPV value ${config.multiPv}`);
      this.appliedOptions.multiPv = config.multiPv;
    }
    if (config.skillLevel !== this.appliedOptions.skillLevel) {
      this.sendCommand(`setoption name Skill Level value ${config.skillLevel}`);
      this.appliedOptions.skillLevel = config.skillLevel;
    }
    if (config.threads !== this.appliedOptions.threads) {
      this.sendCommand(`setoption name Threads value ${config.threads}`);
      this.appliedOptions.threads = config.threads;
    }
    if (config.hash !== this.appliedOptions.hash) {
      this.sendCommand(`setoption name Hash value ${config.hash}`);
      this.appliedOptions.hash = config.hash;
    }

    this.sendCommand(`position fen ${request.fen}`);

    // Both limits together: whichever is reached first ends the search. Depth governs strength,
    // movetime guarantees responsiveness.
    const limits: string[] = [];
    if (config.depth) limits.push(`depth ${config.depth}`);
    if (config.movetime) limits.push(`movetime ${config.movetime}`);
    this.sendCommand(limits.length > 0 ? `go ${limits.join(' ')}` : 'go depth 12');
  }

  public cancelActive(): void {
    if (this.activeRequest) {
      const cancelled = this.activeRequest;
      this.activeRequest = null;
      this.currentLinesMap.clear();
      this.lastReportedDepth = 0;
      this.sendCommand('stop');
      cancelled.onError(new Error('Analysis cancelled'));
    }
  }
}

export const stockfishClient = new StockfishClient();
