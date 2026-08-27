import { MultiPvResult } from '../chess/transpositionResolver';
import { stockfishEngine } from '../engine/stockfishWorker';
import { calculatePositionPriority } from './priorityScorer';

export interface AnalysisTask {
  id: string;
  fen: string;
  priority: number;
  gameId?: string;
  moveSan?: string;
  targetDepth: number;
  multiPvCount: number;
  onComplete?: (result: MultiPvResult) => void;
  onError?: (err: any) => void;
}

class BackgroundAnalysisQueue {
  private queue: AnalysisTask[] = [];
  private isProcessing = false;
  private maxConcurrent = 1; // Conservative 1 worker default to protect browser CPU
  private activeCount = 0;

  public enqueue(task: AnalysisTask) {
    // Avoid queuing exact duplicates
    const existingIndex = this.queue.findIndex(t => t.fen === task.fen);
    if (existingIndex >= 0) {
      if (task.priority > this.queue[existingIndex].priority) {
        this.queue[existingIndex].priority = task.priority;
        this.sortQueue();
      }
      return;
    }

    this.queue.push(task);
    this.sortQueue();
    this.processNext();
  }

  private sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  private async processNext() {
    if (this.isProcessing || this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.isProcessing = true;
    this.activeCount++;

    try {
      const candidates = await stockfishEngine.analyzePosition(
        task.fen,
        task.multiPvCount,
        'TRAINING'
      );

      if (task.onComplete) {
        task.onComplete({
          fen: task.fen,
          fingerprint: {
            normalizedFen: task.fen,
            boardHash: 'hash',
            sideToMove: 'w',
            transpositionKey: task.fen,
            castlingRights: '-',
            enPassantTarget: null,
          },
          depth: task.targetDepth,
          multiPvCount: task.multiPvCount,
          engineVersion: 'stockfish-18-stable',
          bestMoves: candidates,
          timestamp: Date.now(),
        });
      }
    } catch (err) {

      if (task.onError) {
        task.onError(err);
      }
    } finally {
      this.activeCount--;
      this.isProcessing = false;
      this.processNext();
    }
  }

  public clearQueue() {
    this.queue = [];
    stockfishEngine.cancelActiveAnalysis();
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const analysisQueue = new BackgroundAnalysisQueue();
