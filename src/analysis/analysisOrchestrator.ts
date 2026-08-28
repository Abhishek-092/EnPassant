import { Chess } from 'chess.js';
import { analysisQueue } from './analysisQueue';
import { detectOpeningFromMoves } from '../chess/openingDetector';
import { calculatePositionPriority } from './priorityScorer';
import { transpositionResolver } from '../chess/transpositionResolver';
import { classifyMoveAdaptively } from '../engine/adaptiveClassifier';
import { generateHumanExplanation } from '../explanations/generator';
import { indexedDBStorage, CachedGame, UserMistakeRecord } from '../storage/indexedDB';
import { NormalizedGame } from '../providers/GameProvider';

export interface GameAnalysisSummary {
  gameId: string;
  openingName: string;
  variationName?: string;
  theoryExitMoveIndex: number | null;
  theoryExitFen: string | null;
  mistakesFound: number;
}

class AnalysisOrchestrator {
  /**
   * Processes a newly synchronized game:
   * 1. Detects Opening & Theory Exit
   * 2. Extracts Candidate Positions
   * 3. Schedules Priority Background Stockfish Analysis
   * 4. Identifies Personal Blunders / Mistakes
   * 5. Saves games, engine evaluations, and mistakes LOCALLY in IndexedDB (zero cloud cost)
   */
  public async analyzeGame(game: NormalizedGame): Promise<GameAnalysisSummary> {
    const openingDetection = detectOpeningFromMoves(game.moves);

    const chess = new Chess();
    const positionsToQueue: Array<{
      fen: string;
      moveIndex: number;
      userMoveSan: string;
      isUserMove: boolean;
    }> = [];

    // Replay game and extract candidate positions
    for (let i = 0; i < game.moves.length; i++) {
      const moveSan = game.moves[i];
      const fenBefore = chess.fen();
      chess.move(moveSan);

      const isUserMove =
        (game.userColor === 'white' && i % 2 === 0) ||
        (game.userColor === 'black' && i % 2 === 1);

      // Prioritize positions near theory exit, user moves, or middle-game phase
      const isNearTheoryExit = openingDetection.firstDeviationMoveIndex !== null &&
        Math.abs(i - openingDetection.firstDeviationMoveIndex) <= 2;

      if (isUserMove && (isNearTheoryExit || i < 20)) {
        positionsToQueue.push({
          fen: fenBefore,
          moveIndex: i,
          userMoveSan: moveSan,
          isUserMove,
        });
      }
    }

    let mistakesFound = 0;

    // Queue top priority candidate positions for Stockfish evaluation
    for (const posItem of positionsToQueue.slice(0, 5)) {
      const isTheoryExit = openingDetection.firstDeviationMoveIndex === posItem.moveIndex;

      const priority = calculatePositionPriority({
        isUserMove: true,
        isTheoryExit,
        isMajorBlunder: false,
        isLargeEvalSwing: false,
        isTacticalOpportunity: false,
        isRecurringWeakness: false,
        activeTrainingRelevance: 10,
      });

      analysisQueue.enqueue({
        id: `task_${game.id}_${posItem.moveIndex}`,
        fen: posItem.fen,
        priority,
        gameId: game.id,
        moveSan: posItem.userMoveSan,
        targetDepth: 12,
        multiPvCount: 3,
        onComplete: async (evalResult) => {
          const classification = classifyMoveAdaptively(
            posItem.userMoveSan,
            posItem.userMoveSan,
            evalResult.bestMoves,
            posItem.fen
          );

          if (classification.category === 'MISTAKE' || classification.category === 'BLUNDER') {
            mistakesFound++;
            const explanation = generateHumanExplanation(
              posItem.userMoveSan,
              evalResult.bestMoves[0]?.move || 'Nf3',
              evalResult.bestMoves[1]?.move || null,
              openingDetection.opening?.name || 'Opening',
              posItem.fen
            );

            const mistakeRecord: UserMistakeRecord = {
              id: `mistake_${game.id}_${posItem.moveIndex}`,
              gameId: game.id,
              fen: posItem.fen,
              userMove: posItem.userMoveSan,
              recommendedMove: evalResult.bestMoves[0]?.move || '',
              category: posItem.userMoveSan.includes('c5') || posItem.userMoveSan.includes('d5')
                ? 'PAWN_BREAK'
                : 'DEVELOPMENT',
              openingName: openingDetection.opening?.name || game.openingName,
              variationName: openingDetection.variation?.name,
              evalLoss: classification.evalDifference,
              createdAt: Date.now(),
              reviewCount: 0,
              nextReviewAt: Date.now(),
            };

            // Saved strictly to local browser IndexedDB
            await indexedDBStorage.saveMistake(mistakeRecord);
          }
        },
      });
    }

    // Save game record to local IndexedDB (zero cloud cost)
    const cachedGame: CachedGame = {
      id: game.id,
      platform: game.platform,
      externalGameId: game.externalGameId,
      pgn: game.pgn,
      date: game.date,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      userColor: game.userColor,
      result: game.result,
      timeControl: game.timeControl,
      openingName: openingDetection.opening?.name || game.openingName,
      variationName: openingDetection.variation?.name,
      analyzed: true,
      importedAt: Date.now(),
    };

    await indexedDBStorage.saveGame(cachedGame);

    return {
      gameId: game.id,
      openingName: openingDetection.opening?.name || game.openingName,
      variationName: openingDetection.variation?.name,
      theoryExitMoveIndex: openingDetection.firstDeviationMoveIndex,
      theoryExitFen: openingDetection.theoryExitFen,
      mistakesFound,
    };
  }
}

export const analysisOrchestrator = new AnalysisOrchestrator();
