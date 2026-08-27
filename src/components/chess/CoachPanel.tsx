'use client';

import React from 'react';
import { MultiPvCandidate } from '../../chess/transpositionResolver';
import { MoveClassificationResult } from '../../engine/adaptiveClassifier';
import { GeneratedExplanation } from '../../explanations/generator';
import { ShieldCheck, Cpu, Lightbulb, Sparkles, AlertTriangle } from 'lucide-react';

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
    <div className="w-full flex flex-col gap-4 p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] text-[#F2F4F7]">
      {/* Engine Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2E35]">
        <div className="flex items-center gap-2">
          {isEngineVerified ? (
            <Cpu className="w-5 h-5 text-[#D6B15E]" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#4CAF7D]" />
          )}
          <span className="font-semibold text-sm uppercase tracking-wider text-[#8A919C]">
            Stockfish MultiPV Coach
          </span>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
            isEngineVerified
              ? 'bg-[#D6B15E]/10 text-[#D6B15E] border-[#D6B15E]/30'
              : 'bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/30'
          }`}
        >
          {engineStatusText}
        </span>
      </div>

      {/* Move Classification Result */}
      {classification && (
        <div className="p-4 rounded-lg bg-[#1C1F24] border border-[#2A2E35]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-[#8A919C]">Evaluation</span>
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                classification.category === 'BEST' || classification.category === 'EXCELLENT'
                  ? 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                  : classification.category === 'GOOD'
                  ? 'bg-[#D6B15E]/20 text-[#D6B15E]'
                  : 'bg-[#D95D5D]/20 text-[#D95D5D]'
              }`}
            >
              {classification.label}
            </span>
          </div>

          <p className="text-sm text-[#F2F4F7] font-medium">{classification.explanationHint}</p>
        </div>
      )}

      {/* Strategic Explanation */}
      {explanation && (
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-lg bg-[#1C1F24]/80 border border-[#2A2E35]">
            <div className="flex items-center gap-2 mb-1 text-[#D6B15E]">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Strategic Objective</h4>
            </div>
            <p className="text-sm text-[#8A919C] leading-relaxed">{explanation.whyThisMove}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1C1F24]/80 border border-[#2A2E35]">
            <div className="flex items-center gap-2 mb-1 text-[#4CAF7D]">
              <Lightbulb className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Key Takeaway</h4>
            </div>
            <p className="text-sm text-[#8A919C] leading-relaxed">{explanation.whatToRemember}</p>
          </div>
        </div>
      )}

      {/* MultiPV Top Candidate Moves List */}
      {candidates.length > 0 && (
        <div className="mt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A919C] mb-2">
            Top Engine Candidate Moves
          </h4>
          <div className="flex flex-col gap-1.5">
            {candidates.slice(0, 3).map((cand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded bg-[#1C1F24] border border-[#2A2E35]/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center font-bold text-[#8A919C]">#{cand.rank}</span>
                  <span className="font-mono text-[#F2F4F7] font-semibold">{cand.move}</span>
                </div>
                <span className="font-mono text-[#D6B15E]">
                  {cand.evaluation >= 0 ? `+${(cand.evaluation / 100).toFixed(2)}` : (cand.evaluation / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint Button */}
      {onShowHint && (
        <button
          onClick={onShowHint}
          className="mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1C1F24] hover:bg-[#2A2E35] border border-[#2A2E35] text-xs font-semibold text-[#D6B15E] transition-all"
        >
          <Lightbulb className="w-4 h-4" />
          Need a Strategic Hint?
        </button>
      )}

      {hintMessage && (
        <div className="p-3 rounded-lg bg-[#D6B15E]/10 border border-[#D6B15E]/30 text-xs text-[#D6B15E]">
          {hintMessage}
        </div>
      )}
    </div>
  );
};
