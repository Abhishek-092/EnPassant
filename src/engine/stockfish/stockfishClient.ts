import { parseUciInfoLine } from './stockfishProtocol';
import { EngineLine, MultiPvResult, EngineMetadata, EngineConfiguration } from './types';
import { getPositionFingerprint } from '../../chess/positionFingerprint';

export interface AnalysisRequest {
  id: string;
  fen: string;
  config: EngineConfiguration;
  onComplete: (result: MultiPvResult) => void;
  onError: (err: any) => void;
}

export class StockfishClient {
  private worker: Worker | null = null;
  private isLoaded = false;
  private isUciOk = false;
  private isReady = false;
  private activeRequest: AnalysisRequest | null = null;
  private currentLinesMap = new Map<number, EngineLine>();
  private activeIdCounter = 0;

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
    try {
      // Create Worker pointing to compiled stockfish.js asset
      this.worker = new Worker('/stockfish.js');
      this.isLoaded = true;

      this.worker.onmessage = (e: MessageEvent) => {
        this.handleMessage(String(e.data));
      };

      this.worker.onerror = (err) => {
        console.warn('Stockfish Worker error:', err);
        if (this.activeRequest) {
          this.activeRequest.onError(err);
          this.activeRequest = null;
        }
      };

      // Send initial UCI initialization handshake
      this.sendCommand('uci');
    } catch (err) {
      console.warn('Failed to load Stockfish WASM worker:', err);
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

    if (!this.activeRequest) return;

    // Parse info lines
    if (trimmed.startsWith('info ') && trimmed.includes('pv')) {
      const parsedLine = parseUciInfoLine(trimmed, this.activeRequest.fen);
      if (parsedLine && parsedLine.rank) {
        this.currentLinesMap.set(parsedLine.rank, parsedLine as EngineLine);
      }
      return;
    }

    // Parse bestmove
    if (trimmed.startsWith('bestmove')) {
      const parts = trimmed.split(/\s+/);
      const bestMoveUci = parts[1];

      const lines = Array.from(this.currentLinesMap.values()).sort((a, b) => a.rank - b.rank);
      const fingerprint = getPositionFingerprint(this.activeRequest.fen);

      const result: MultiPvResult = {
        fen: this.activeRequest.fen,
        fingerprintKey: fingerprint.transpositionKey,
        bestMove: bestMoveUci,
        lines,
        depth: this.activeRequest.config.depth || 16,
        engineMetadata: this.engineMetadata,
        timestamp: Date.now(),
        searchProfile: this.activeRequest.config.searchMode,
      };

      const callback = this.activeRequest.onComplete;
      this.activeRequest = null;
      this.currentLinesMap.clear();
      callback(result);
    }
  }

  public analyze(request: AnalysisRequest): void {
    // Invalidate and cancel previous active request
    if (this.activeRequest) {
      this.sendCommand('stop');
      this.activeRequest = null;
    }

    this.activeIdCounter++;
    this.activeRequest = request;
    this.currentLinesMap.clear();

    const config = request.config;

    // Configure Stockfish MultiPV and Threads
    this.sendCommand(`setoption name MultiPV value ${config.multiPv}`);
    this.sendCommand(`setoption name Threads value ${config.threads}`);
    this.sendCommand(`setoption name Hash value ${config.hash}`);
    this.sendCommand('isready');

    // Position & Search limits
    this.sendCommand(`position fen ${request.fen}`);
    if (config.depth) {
      this.sendCommand(`go depth ${config.depth}`);
    } else if (config.movetime) {
      this.sendCommand(`go movetime ${config.movetime}`);
    } else {
      this.sendCommand('go depth 16');
    }
  }

  public cancelActive(): void {
    if (this.activeRequest) {
      this.sendCommand('stop');
      this.activeRequest = null;
      this.currentLinesMap.clear();
    }
  }
}

export const stockfishClient = new StockfishClient();
