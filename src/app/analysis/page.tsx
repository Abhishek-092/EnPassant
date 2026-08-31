'use client';

import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { bestCandidateForSideToMove } from '@/engine/evaluationUtils';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BarChart3, Play, RotateCcw } from 'lucide-react';

export default function AnalysisPage() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [mateScore, setMateScore] = useState<number | null>(null);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    try {
      const moveCopy = new Chess(game.fen());
      const moveObj = moveCopy.move({
        from: sourceSquare,
        to: targetSquare.slice(0, 2),
        promotion: targetSquare.length > 2 ? targetSquare[2] : 'q',
      });

      if (!moveObj) return false;

      setLastMove({ from: sourceSquare, to: targetSquare.slice(0, 2) });
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

    const best = bestCandidateForSideToMove(resCandidates, currentFen);
    setEvaluation(best ? best.evaluation : null);
    setMateScore(best?.mateScore ?? null);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    const c = new Chess();
    setGame(c);
    setFen(c.fen());
    setLastMove(null);
    setCandidates([]);
    setEvaluation(null);
    setMateScore(null);
  };

  const status = stockfishEngine.getStatus();

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-[#242A35] pb-6 gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#E5B842]" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#F0F3F8]">
                ANALYSIS BOARD
              </h1>
              <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
                EXPLORE VARIATIONS WITH LIVE STOCKFISH 18 MULTIPV EVALUATIONS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrutalistButton
              variant="primary"
              onClick={() => triggerAnalysis(fen)}
              disabled={isAnalyzing}
            >
              <Play className={`w-3.5 h-3.5 inline mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
            </BrutalistButton>
            <BrutalistButton
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              Reset Board
            </BrutalistButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <ChessBoardWrapper
              fen={fen}
              onMove={handleMove}
              lastMove={lastMove}
              orientation="white"
            />
          </div>

          <div className="lg:col-span-5">
            <CoachPanel
              engineStatusText={status.statusText.toUpperCase()}
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
