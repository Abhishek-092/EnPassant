'use client';

import React from 'react';
import { formatEvaluation, whiteWinShare } from '../../engine/evaluationUtils';

interface EvaluationBarProps {
  /** Centipawns from White's perspective (positive = White better). */
  evaluation: number | null;
  /** Mate distance from White's perspective, when the position is a forced mate. */
  mateScore?: number | null;
  /** Board orientation, so White's share sits on the side White plays from. */
  orientation?: 'white' | 'black';
  isAnalyzing?: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  mateScore = null,
  orientation = 'white',
  isAnalyzing = false,
}) => {
  const whitePct = whiteWinShare(evaluation, mateScore);
  const hasEvaluation = evaluation !== null || (mateScore !== null && mateScore !== 0);

  // White's segment sits at the bottom when White is the side at the bottom of the board.
  const whiteAtBottom = orientation === 'white';
  const topPct = whiteAtBottom ? 100 - whitePct : whitePct;
  const topIsWhite = !whiteAtBottom;

  const whiteSegment = 'bg-gradient-to-b from-[#F0F3F8] to-[#C8D2E0]';
  const blackSegment = 'bg-gradient-to-b from-[#1B2028] to-[#0B0D10]';

  return (
    <div
      className="relative w-7 shrink-0 flex flex-col border-2 border-[#242A35] bg-[#0B0D10] shadow-brutal-sm overflow-hidden"
      title={`Evaluation ${formatEvaluation(evaluation, mateScore)} (White's perspective)`}
    >
      <div
        className={`w-full transition-all duration-500 ease-out ${topIsWhite ? whiteSegment : blackSegment}`}
        style={{ height: `${topPct}%` }}
      />
      <div
        className={`w-full flex-1 transition-all duration-500 ease-out ${topIsWhite ? blackSegment : whiteSegment}`}
      />

      {/* Equality reference line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-[#E5B842]/40" />

      {/* Numeric readout, kept on its own chip so it stays legible over either segment */}
      <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
        <span
          className={`px-1 py-0.5 bg-[#0B0D10]/90 border border-[#242A35] font-mono text-[9px] font-black tracking-tight ${
            hasEvaluation ? 'text-[#E5B842]' : 'text-[#64748B]'
          } ${isAnalyzing ? 'animate-pulse' : ''}`}
        >
          {isAnalyzing && !hasEvaluation ? '···' : formatEvaluation(evaluation, mateScore)}
        </span>
      </div>
    </div>
  );
};
