'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { classifyMoveAdaptively, MoveClassificationResult } from '@/engine/adaptiveClassifier';
import { generateHumanExplanation, GeneratedExplanation } from '@/explanations/generator';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { SessionGenerator, DailyTrainingItem } from '@/training/sessionGenerator';
import { Target, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TrainPage() {
  const [sessionItem, setSessionItem] = useState<DailyTrainingItem | null>(null);
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [classification, setClassification] = useState<MoveClassificationResult | null>(null);
  const [explanation, setExplanation] = useState<GeneratedExplanation | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    initTraining();
  }, []);

  const initTraining = async () => {
    const daily = await SessionGenerator.generateDailySession();
    if (daily.items.length > 0) {
      const item = daily.items[0];
      setSessionItem(item);
      const c = new Chess(item.fen);
      setGame(c);
      setFen(c.fen());
      runEngineAnalysis(c.fen());
    }
  };

  const runEngineAnalysis = async (currentFen: string) => {
    const resCandidates = await stockfishEngine.analyzePosition(currentFen, 3, 'TRAINING');
    setCandidates(resCandidates);
  };


  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    try {
      const moveCopy = new Chess(game.fen());
      const moveObj = moveCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!moveObj) return false;

      setGame(moveCopy);
      setFen(moveCopy.fen());

      // Classify user move against Stockfish MultiPV candidates
      const classRes = classifyMoveAdaptively(
        moveObj.san,
        sourceSquare + targetSquare,
        candidates,
        game.fen()
      );
      setClassification(classRes);

      const expRes = generateHumanExplanation(
        moveObj.san,
        candidates[0]?.move || moveObj.san,
        candidates[1]?.move || null,
        sessionItem?.openingName || 'the opening',
        game.fen()
      );
      setExplanation(expRes);

      if (classRes.category === 'BEST' || classRes.category === 'EXCELLENT') {
        setIsCompleted(true);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {
          // Fallback if canvas absent
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleShowHint = () => {
    if (candidates.length > 0) {
      const bestMove = candidates[0].move;
      setHintMessage(`Strategic Hint: Look for piece/pawn action involving key move idea '${bestMove.charAt(0).toUpperCase()}'.`);
    }
  };

  const handleReset = () => {
    if (sessionItem) {
      const c = new Chess(sessionItem.fen);
      setGame(c);
      setFen(c.fen());
      setClassification(null);
      setExplanation(null);
      setHintMessage(null);
      setIsCompleted(false);
    }
  };

  const status = stockfishEngine.getStatus();

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-[#D6B15E]" />
            <div>
              <h1 className="text-xl font-extrabold text-[#F2F4F7]">
                {sessionItem ? sessionItem.title : 'Adaptive Opening Training'}
              </h1>
              <p className="text-xs text-[#8A919C]">
                {sessionItem ? sessionItem.prompt : 'Find the top Stockfish engine move.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#15171B] border border-[#2A2E35] text-xs font-semibold text-[#8A919C] hover:text-[#F2F4F7]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Position
          </button>
        </div>

        {/* Main Training Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Chess Board Column */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <ChessBoardWrapper
              fen={fen}
              onMove={handleMove}
              orientation={sessionItem?.userColor || 'white'}
            />

            {isCompleted && (
              <div className="w-full max-w-[540px] p-4 rounded-xl bg-[#4CAF7D]/10 border border-[#4CAF7D]/30 flex items-center justify-between text-[#4CAF7D]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Position Solved! Best Move Found.</span>
                </div>
                <button
                  onClick={initTraining}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#4CAF7D] text-black font-bold text-xs"
                >
                  Next Position
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Engine & Coach Panel Column */}
          <div className="lg:col-span-5">
            <CoachPanel
              engineStatusText={status.statusText}
              isEngineVerified={status.available}
              candidates={candidates}
              classification={classification}
              explanation={explanation}
              onShowHint={handleShowHint}
              hintMessage={hintMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
