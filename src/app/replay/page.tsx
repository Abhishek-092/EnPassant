'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { Chess } from 'chess.js';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { bestCandidateForSideToMove } from '@/engine/evaluationUtils';
import { classifyMoveAdaptively, MoveClassificationResult } from '@/engine/adaptiveClassifier';
import { generateHumanExplanation, GeneratedExplanation } from '@/explanations/generator';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ReplayPage() {
  const [chess, setChess] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chess.fen());
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [classification, setClassification] = useState<MoveClassificationResult | null>(null);
  const [explanation, setExplanation] = useState<GeneratedExplanation | null>(null);
  const [engineStatusText, setEngineStatusText] = useState<string>('INITIALIZING ENGINE...');
  const [isEngineVerified, setIsEngineVerified] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [mateScore, setMateScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    analyzeCurrentPosition();
  }, [fen]);

  const analyzeCurrentPosition = async () => {
    setEngineStatusText('ANALYZING BLUNDER POSITION...');
    setIsAnalyzing(true);
    const resultCandidates = await stockfishEngine.analyzePosition(fen, {
      multiPv: 3,
      profile: 'TRAINING',
      onProgress: partial => {
        setMateScore(partial.mateScore);
        setEvaluation(partial.mateScore !== null ? null : partial.evaluationCp);
      },
    });
    const status = stockfishEngine.getStatus();
    setEngineStatusText(status.statusText.toUpperCase());
    setIsEngineVerified(status.available);
    setCandidates(resultCandidates);

    const best = bestCandidateForSideToMove(resultCandidates, fen);
    if (best) {
      setEvaluation(best.evaluation);
      setMateScore(best.mateScore ?? null);
    }
    setIsAnalyzing(false);
  };

  const handleMove = (source: string, target: string): boolean => {
    try {
      const move = chess.move({
        from: source,
        to: target.slice(0, 2),
        promotion: target.length > 2 ? target[2] : 'q',
      });
      if (!move) return false;

      setLastMove({ from: source, to: target.slice(0, 2) });
      setFen(chess.fen());
      setHintMessage(null);

      if (candidates.length > 0) {
        const classResult = classifyMoveAdaptively(move.san, `${source}${target}`, candidates, fen);
        setClassification(classResult);

        const exp = generateHumanExplanation(move.san, candidates[0].move, candidates[1]?.move || null, 'Blunder Replay', fen);
        setExplanation(exp);
      }

      analyzeCurrentPosition();
      return true;
    } catch {
      return false;
    }
  };

  const handleShowHint = () => {
    if (candidates.length > 0) {
      setHintMessage(`Stockfish suggests playing ${candidates[0].move.toUpperCase()} to correct the tactical inaccuracy.`);
    } else {
      setHintMessage('Stockfish is evaluating...');
    }
  };

  const resetBoard = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setLastMove(null);
    setClassification(null);
    setExplanation(null);
    setHintMessage(null);
    analyzeCurrentPosition();
  };

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              REPLAY & CORRECT
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              YOUR GAME. YOUR MISTAKE. YOUR SECOND CHANCE.
            </p>
          </div>

          <BrutalistButton variant="outline" onClick={resetBoard}>
            <RefreshCw className="w-4 h-4 inline mr-1" /> RESET MISTAKE
          </BrutalistButton>
        </div>

        <div className="p-4 bg-[#181C24] text-[#F0F3F8] border-2 border-[#EF4444]/60 shadow-brutal flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#EF4444]" />
            <div>
              <h3 className="font-extrabold text-sm uppercase text-[#F0F3F8]">MISTAKE DETECTED IN YOUR GAME</h3>
              <p className="text-xs font-mono font-medium text-[#94A0B8]">WHAT WOULD YOU PLAY NOW? CLICK OR DRAG TO MOVE.</p>
            </div>
          </div>
          <BrutalistBadge variant="error">BLUNDER CORRECTION</BrutalistBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Center Column: Chessboard Wrapper */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <ChessBoardWrapper
              fen={fen}
              onMove={handleMove}
              lastMove={lastMove}
              orientation="white"
              evaluation={evaluation}
              mateScore={mateScore}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right Column: Coach Panel */}
          <div className="lg:col-span-5">
            <CoachPanel
              engineStatusText={engineStatusText}
              isEngineVerified={isEngineVerified}
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
