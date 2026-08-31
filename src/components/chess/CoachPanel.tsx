'use client';

import React from 'react';
import { MultiPvCandidate } from '../../chess/transpositionResolver';
import { MoveClassificationResult } from '../../engine/adaptiveClassifier';
import { GeneratedExplanation } from '../../explanations/generator';
import { MoveReview } from '../../training/moveReview';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { BrutalistButton } from '../ui/BrutalistButton';
import { Cpu, Sparkles, Lightbulb, Bot, CheckCircle2, TrendingDown } from 'lucide-react';

interface CoachPanelProps {
  engineStatusText: string;
  isEngineVerified: boolean;
  candidates: MultiPvCandidate[];
  classification: MoveClassificationResult | null;
  explanation: GeneratedExplanation | null;
  onShowHint?: () => void;
  hintMessage?: string | null;
  /** Post-move verdict: what was played, and what would have been better. */
  moveReview?: MoveReview | null;
  /** Current opponent strength, shown so difficulty progression is visible. */
  opponent?: { label: string; description: string; isThinking: boolean } | null;
}

const CATEGORY_TONE: Record<string, 'success' | 'orange' | 'error'> = {
  BEST: 'success',
  EXCELLENT: 'success',
  GOOD: 'orange',
  INACCURACY: 'orange',
  MISTAKE: 'error',
  BLUNDER: 'error',
};

export const CoachPanel: React.FC<CoachPanelProps> = ({
  engineStatusText,
  isEngineVerified,
  candidates,
  classification,
  explanation,
  onShowHint,
  hintMessage,
  moveReview = null,
  opponent = null,
}) => {
  return (
    <div className="w-full flex flex-col gap-5 p-6 bg-[#12151B] border-2 border-[#242A35] shadow-brutal text-[#F0F3F8]">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#242A35]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#E5B842]" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#F0F3F8]">
            STOCKFISH 18 COACH
          </h3>
        </div>
        <BrutalistBadge variant={isEngineVerified ? 'orange' : 'dark'}>
          {engineStatusText}
        </BrutalistBadge>
      </div>

      {/* Opponent strength */}
      {opponent && (
        <div className="flex items-center justify-between p-3 bg-[#181C24] border border-[#242A35] shadow-brutal-sm">
          <div className="flex items-center gap-2.5">
            <Bot className={`w-4 h-4 text-[#E5B842] ${opponent.isThinking ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col">
              <span className="font-extrabold text-[11px] uppercase tracking-widest text-[#F0F3F8]">
                OPPONENT: {opponent.label}
              </span>
              <span className="text-[10px] text-[#94A0B8]">{opponent.description}</span>
            </div>
          </div>
          {opponent.isThinking && <BrutalistBadge variant="orange">THINKING</BrutalistBadge>}
        </div>
      )}

      {/* Post-move verdict: what could have been done better */}
      {moveReview && (
        <div
          className={`p-4 border shadow-brutal-sm flex flex-col gap-2.5 ${
            moveReview.wasBest
              ? 'bg-[#10B981]/10 border-[#10B981]/40'
              : 'bg-[#181C24] border-[#EF4444]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {moveReview.wasBest ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              )}
              <span className="font-mono text-xs font-black uppercase tracking-wider text-[#F0F3F8]">
                YOU PLAYED {moveReview.playedSan}
              </span>
            </div>
            <BrutalistBadge variant={CATEGORY_TONE[moveReview.category] ?? 'orange'}>
              {moveReview.label}
            </BrutalistBadge>
          </div>

          <p className="text-xs text-[#94A0B8] leading-relaxed">{moveReview.reason}</p>

          {moveReview.bookSan && (
            <div className="px-3 py-2 bg-[#E5B842]/10 border border-[#E5B842]/30 font-mono text-[11px]">
              <span className="font-bold text-[#E5B842]">THEORY MOVE: {moveReview.bookSan}</span>
              <span className="text-[#94A0B8]"> — you left the trained line here.</span>
            </div>
          )}

          {!moveReview.wasBest && moveReview.bestSan && (
            <div className="px-3 py-2 bg-[#0B0D10] border border-[#242A35] font-mono text-[11px] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#10B981]">BETTER: {moveReview.bestSan}</span>
                {moveReview.evalLossCp > 0 && (
                  <span className="font-bold text-[#EF4444]">
                    −{(moveReview.evalLossCp / 100).toFixed(2)}
                  </span>
                )}
              </div>
              {moveReview.bestLine.length > 1 && (
                <span className="text-[10px] text-[#94A0B8]">
                  LINE: {moveReview.bestLine.join(' ')}
                </span>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 pt-1">
            <Lightbulb className="w-3.5 h-3.5 text-[#E5B842] shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-[#F0F3F8] leading-relaxed">
              {moveReview.takeaway}
            </p>
          </div>
        </div>
      )}

      {/* Move Classification Result */}
      {classification && !moveReview && (
        <div className="p-4 bg-[#181C24] border border-[#242A35] shadow-brutal-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#94A0B8]">
              EVALUATION
            </span>
            <BrutalistBadge variant={CATEGORY_TONE[classification.category] ?? 'orange'}>
              {classification.label}
            </BrutalistBadge>
          </div>

          <p className="font-semibold text-sm text-[#F0F3F8]">{classification.explanationHint}</p>
        </div>
      )}

      {/* Strategic Explanation */}
      {explanation && !moveReview && (
        <div className="flex flex-col gap-3">
          <div className="p-4 bg-[#181C24] border border-[#242A35] shadow-brutal-sm">
            <div className="flex items-center gap-2 mb-1.5 text-[#E5B842]">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-extrabold text-xs uppercase tracking-widest">WHY THIS MOVE?</h4>
            </div>
            <p className="text-xs text-[#94A0B8] leading-relaxed">{explanation.whyThisMove}</p>
          </div>

          <div className="p-4 bg-[#E5B842]/10 border border-[#E5B842]/30 shadow-brutal-sm">
            <div className="flex items-center gap-2 mb-1.5 text-[#E5B842]">
              <Lightbulb className="w-4 h-4" />
              <h4 className="font-extrabold text-xs uppercase tracking-widest">KEY TAKEAWAY</h4>
            </div>
            <p className="text-xs font-semibold text-[#F0F3F8] leading-relaxed">{explanation.whatToRemember}</p>
          </div>
        </div>
      )}

      {/* MultiPV Top Candidate Moves List */}
      {candidates.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#242A35]">
          <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-[#94A0B8]">
            TOP ENGINE CANDIDATE LINES
          </h4>
          <div className="flex flex-col gap-2">
            {candidates.slice(0, 3).map((cand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#E5B842]">#{cand.rank}</span>
                  <span className="font-bold text-[#F0F3F8]">{cand.move}</span>
                </div>
                <span className="font-bold text-[#94A0B8]">
                  {cand.evaluation >= 0 ? `+${(cand.evaluation / 100).toFixed(2)}` : (cand.evaluation / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint Button */}
      {onShowHint && (
        <BrutalistButton variant="outline" onClick={onShowHint} className="mt-2">
          💡 Request Strategic Hint
        </BrutalistButton>
      )}

      {hintMessage && (
        <div className="p-3 bg-[#E5B842]/15 border border-[#E5B842]/40 text-xs font-bold text-[#E5B842]">
          {hintMessage}
        </div>
      )}
    </div>
  );
};
