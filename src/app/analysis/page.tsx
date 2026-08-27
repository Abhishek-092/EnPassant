'use client';

import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { BarChart3, Play, RotateCcw } from 'lucide-react';

export default function AnalysisPage() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      triggerAnalysis(moveCopy.fen());
      return true;
    } catch {
      return false;
    }
  };

  const triggerAnalysis = async (currentFen: string) => {
    setIsAnalyzing(true);
    const resCandidates = await stockfishEngine.analyzePosition(currentFen, 4, 'DEEP');
    setCandidates(resCandidates);
    setIsAnalyzing(false);
  };


  const handleReset = () => {
    const c = new Chess();
    setGame(c);
    setFen(c.fen());
    setCandidates([]);
  };

  const status = stockfishEngine.getStatus();

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#D6B15E]" />
            <div>
              <h1 className="text-xl font-extrabold text-[#F2F4F7]">Interactive Analysis Board</h1>
              <p className="text-xs text-[#8A919C]">
                Explore variations with live Stockfish MultiPV evaluations and positional heuristics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerAnalysis(fen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs transition-all shadow-lg"
            >
              <Play className="w-3.5 h-3.5" />
              Analyze Position
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#15171B] border border-[#2A2E35] text-xs font-semibold text-[#8A919C] hover:text-[#F2F4F7]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Board
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <ChessBoardWrapper fen={fen} onMove={handleMove} orientation="white" />
          </div>

          <div className="lg:col-span-5">
            <CoachPanel
              engineStatusText={status.statusText}
              isEngineVerified={status.available}
              candidates={candidates}
              classification={null}
              explanation={null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
