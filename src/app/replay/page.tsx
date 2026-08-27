'use client';

import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { classifyMoveAdaptively, MoveClassificationResult } from '@/engine/adaptiveClassifier';
import { generateHumanExplanation, GeneratedExplanation } from '@/explanations/generator';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { indexedDBStorage, UserMistakeRecord } from '@/storage/indexedDB';
import { RotateCcw, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReplayPage() {
  const [mistakes, setMistakes] = useState<UserMistakeRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [classification, setClassification] = useState<MoveClassificationResult | null>(null);
  const [explanation, setExplanation] = useState<GeneratedExplanation | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = async () => {
    const list = await indexedDBStorage.getMistakes();
    if (list.length > 0) {
      setMistakes(list);
      setupMistakePosition(list[0]);
    } else {
      // Default fallback demo mistake if none synced yet
      const demoMistake: UserMistakeRecord = {
        id: 'demo_mistake_1',
        gameId: 'game_demo',
        fen: 'rn1qkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 4',
        userMove: 'e6',
        recommendedMove: 'c5',
        category: 'PAWN_BREAK',
        openingName: 'Caro-Kann Defense',
        variationName: 'Advance Variation',
        evalLoss: 120,
        createdAt: Date.now(),
        reviewCount: 0,
        nextReviewAt: Date.now(),
      };
      setMistakes([demoMistake]);
      setupMistakePosition(demoMistake);
    }
  };

  const setupMistakePosition = async (mistake: UserMistakeRecord) => {
    const c = new Chess(mistake.fen);
    setGame(c);
    setFen(c.fen());
    setIsSolved(false);
    setClassification(null);
    setExplanation(null);

    const resCandidates = await stockfishEngine.analyzePosition(mistake.fen, 3, 'TRAINING');
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

      const currentMistake = mistakes[currentIndex];

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
        currentMistake?.openingName || 'Opening',
        game.fen()
      );
      setExplanation(expRes);

      if (classRes.category === 'BEST' || classRes.category === 'EXCELLENT') {
        setIsSolved(true);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } catch {
          // Fallback
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleNextMistake = () => {
    if (currentIndex < mistakes.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupMistakePosition(mistakes[nextIdx]);
    }
  };

  const currentMistake = mistakes[currentIndex];
  const status = stockfishEngine.getStatus();

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-[#D6B15E]" />
            <div>
              <h1 className="text-xl font-extrabold text-[#F2F4F7]">
                Replay & Correct Personal Blunders
              </h1>
              <p className="text-xs text-[#8A919C]">
                {currentMistake
                  ? `Position from ${currentMistake.openingName} (${currentMistake.variationName || 'Main Line'})`
                  : 'Replay critical game positions and find the top engine alternative.'}
              </p>
            </div>
          </div>

          {mistakes.length > 1 && (
            <span className="text-xs font-semibold px-3 py-1 rounded bg-[#15171B] border border-[#2A2E35] text-[#D6B15E]">
              Mistake {currentIndex + 1} of {mistakes.length}
            </span>
          )}
        </div>

        {/* Warning Prompt Box */}
        {currentMistake && (
          <div className="p-4 rounded-xl bg-[#D95D5D]/10 border border-[#D95D5D]/30 flex items-center justify-between text-[#F2F4F7]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D95D5D]" />
              <div className="text-xs">
                <span className="font-bold text-[#D95D5D] uppercase tracking-wider">
                  Game Deviation:
                </span>{' '}
                You played <strong className="underline text-[#F2F4F7]">{currentMistake.userMove}</strong> in your game. What move should you have played instead?
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <ChessBoardWrapper fen={fen} onMove={handleMove} orientation="white" />

            {isSolved && (
              <div className="w-full max-w-[540px] p-4 rounded-xl bg-[#4CAF7D]/10 border border-[#4CAF7D]/30 flex items-center justify-between text-[#4CAF7D]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Mistake Corrected! Top Move Found.</span>
                </div>

                {currentIndex < mistakes.length - 1 && (
                  <button
                    onClick={handleNextMistake}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#4CAF7D] text-black font-bold text-xs"
                  >
                    Next Blunder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <CoachPanel
              engineStatusText={status.statusText}
              isEngineVerified={status.available}
              candidates={candidates}
              classification={classification}
              explanation={explanation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
