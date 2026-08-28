'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { Chess } from 'chess.js';
import { StockfishClient } from '@/engine/stockfish/stockfishClient';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { AdaptiveClassifier, MoveClassificationResult } from '@/engine/adaptiveClassifier';
import { ExplanationGenerator, GeneratedExplanation } from '@/explanations/generator';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { RefreshCw } from 'lucide-react';

export default function TrainPage() {
  const [chess, setChess] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chess.fen());
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [classification, setClassification] = useState<MoveClassificationResult | null>(null);
  const [explanation, setExplanation] = useState<GeneratedExplanation | null>(null);
  const [engineStatusText, setEngineStatusText] = useState<string>('INITIALIZING ENGINE...');
  const [isEngineVerified, setIsEngineVerified] = useState<boolean>(false);

  useEffect(() => {
    const stockfish = StockfishClient.getInstance();
    stockfish.init().then(() => {
      setEngineStatusText('ENGINE VERIFIED (STOCKFISH 18)');
      setIsEngineVerified(true);
      analyzeCurrentPosition();
    });
  }, []);

  const analyzeCurrentPosition = async () => {
    const stockfish = StockfishClient.getInstance();
    setEngineStatusText('ANALYZING POSITION...');
    const result = await stockfish.analyzePosition(fen, 'TRAINING');
    setEngineStatusText('ENGINE VERIFIED (STOCKFISH 18)');

    const parsedCandidates: MultiPvCandidate[] = result.lines.map((line, idx) => ({
      rank: idx + 1,
      move: line.pvSan[0] || 'N/A',
      pvSan: line.pvSan,
      evaluation: line.cp,
    }));

    setCandidates(parsedCandidates);
  };

  const handleMove = (source: string, target: string): boolean => {
    try {
      const move = chess.move({ from: source, to: target, promotion: 'q' });
      if (!move) return false;

      setFen(chess.fen());

      if (candidates.length > 0) {
        const topEval = candidates[0].evaluation;
        const playedLine = candidates.find(c => c.move === move.san);
        const playedEval = playedLine ? playedLine.evaluation : topEval - 120;

        const classResult = AdaptiveClassifier.classifyMove(topEval, playedEval, candidates[0].move, move.san);
        setClassification(classResult);

        const exp = ExplanationGenerator.generate(fen, move.san, candidates[0].move, classResult);
        setExplanation(exp);
      }

      analyzeCurrentPosition();
      return true;
    } catch {
      return false;
    }
  };

  const resetBoard = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setClassification(null);
    setExplanation(null);
    analyzeCurrentPosition();
  };

  return (
    <div className="flex min-h-screen bg-[#F2F0E6] text-[#111111]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-3 border-[#111111] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#111111]">
              TRAINING LABORATORY
            </h1>
            <p className="text-xs font-mono font-bold text-[#FF4D00] uppercase tracking-wider mt-1">
              ADAPTIVE OPENING REPETITION & STOCKFISH 18 ANALYSIS
            </p>
          </div>

          <BrutalistButton variant="outline" onClick={resetBoard}>
            <RefreshCw className="w-4 h-4 inline mr-1" /> RESET BOARD
          </BrutalistButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Opening Info */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <BrutalistCard>
              <div className="flex flex-col gap-2 border-b-2 border-[#111111] pb-3">
                <BrutalistBadge variant="orange">ECO B12</BrutalistBadge>
                <h3 className="font-black text-xl uppercase">CARO-KANN DEFENSE</h3>
                <p className="text-xs font-bold text-[#111111]">ADVANCE VARIATION</p>
              </div>

              <div className="flex flex-col gap-2 pt-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">DRILL:</span>
                  <span className="font-black text-[#FF4D00]">04 / 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">STATUS:</span>
                  <span className="font-black text-[#19A463]">ACTIVE</span>
                </div>
              </div>
            </BrutalistCard>
          </div>

          {/* Center Column: Chessboard Wrapper */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <ChessBoardWrapper fen={fen} onMove={handleMove} />
          </div>

          {/* Right Column: Coach Panel */}
          <div className="lg:col-span-4">
            <CoachPanel
              engineStatusText={engineStatusText}
              isEngineVerified={isEngineVerified}
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
