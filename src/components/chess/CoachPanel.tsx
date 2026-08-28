'use client';

import React from 'react';
import { MultiPvCandidate } from '../../chess/transpositionResolver';
import { MoveClassificationResult } from '../../engine/adaptiveClassifier';
import { GeneratedExplanation } from '../../explanations/generator';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { BrutalistButton } from '../ui/BrutalistButton';
import { Cpu, ShieldCheck, Sparkles, Lightbulb } from 'lucide-react';

interface CoachPanelProps {
  engineStatusText: string;
  isEngineVerified: boolean;
  candidates: MultiPvCandidate[];
  classification: MoveClassificationResult | null;
  explanation: GeneratedExplanation | null;
  onShowHint?: () => void;
  hintMessage?: string | null;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  engineStatusText,
  isEngineVerified,
  candidates,
  classification,
  explanation,
  onShowHint,
  hintMessage,
}) => {
  return (
    <div className="w-full flex flex-col gap-5 p-6 bg-white border-3 border-[#111111] shadow-brutal text-[#111111]">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between pb-4 border-b-3 border-[#111111]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#FF4D00]" />
          <h3 className="font-black text-sm uppercase tracking-widest">
            STOCKFISH 18 ENGINE COACH
          </h3>
        </div>
        <BrutalistBadge variant={isEngineVerified ? 'orange' : 'acid'}>
          {engineStatusText}
        </BrutalistBadge>
      </div>

      {/* Move Classification Result */}
      {classification && (
        <div className="p-4 bg-[#F2F0E6] border-2 border-[#111111] shadow-brutal-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
              EVALUATION
            </span>
            <BrutalistBadge
              variant={
                classification.category === 'BEST' || classification.category === 'EXCELLENT'
                  ? 'success'
                  : classification.category === 'GOOD'
                  ? 'acid'
                  : 'error'
              }
            >
              {classification.label}
            </BrutalistBadge>
          </div>

          <p className="font-bold text-sm text-[#111111]">{classification.explanationHint}</p>
        </div>
      )}

      {/* Strategic Explanation */}
      {explanation && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white border-2 border-[#111111] shadow-brutal-sm">
            <div className="flex items-center gap-2 mb-1.5 text-[#FF4D00]">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-black text-xs uppercase tracking-widest">WHY THIS MOVE?</h4>
            </div>
            <p className="text-xs font-medium text-[#111111] leading-relaxed">{explanation.whyThisMove}</p>
          </div>

          <div className="p-4 bg-[#D7FF00]/20 border-2 border-[#111111] shadow-brutal-sm">
            <div className="flex items-center gap-2 mb-1.5 text-[#111111]">
              <Lightbulb className="w-4 h-4" />
              <h4 className="font-black text-xs uppercase tracking-widest">KEY TAKEAWAY</h4>
            </div>
            <p className="text-xs font-bold text-[#111111] leading-relaxed">{explanation.whatToRemember}</p>
          </div>
        </div>
      )}

      {/* MultiPV Top Candidate Moves List */}
      {candidates.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#111111]">
          <h4 className="font-black text-xs uppercase tracking-widest text-[#111111]">
            TOP ENGINE CANDIDATE LINES
          </h4>
          <div className="flex flex-col gap-2">
            {candidates.slice(0, 3).map((cand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2.5 bg-[#F2F0E6] border-2 border-[#111111] font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#FF4D00]">#{cand.rank}</span>
                  <span className="font-bold text-[#111111]">{cand.move}</span>
                </div>
                <span className="font-bold text-[#111111]">
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
        <div className="p-3 bg-[#FF4D00]/10 border-2 border-[#FF4D00] text-xs font-bold text-[#111111]">
          {hintMessage}
        </div>
      )}
    </div>
  );
};

