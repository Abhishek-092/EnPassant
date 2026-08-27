'use client';

import React from 'react';
import Link from 'next/link';
import { OpeningDefinition } from '@/openings/database';
import { BookOpen, Target, CheckCircle2 } from 'lucide-react';

interface OpeningCardProps {
  opening: OpeningDefinition;
  masteryPercentage?: number;
}

export const OpeningCard: React.FC<OpeningCardProps> = ({ opening, masteryPercentage = 65 }) => {
  return (
    <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] hover:border-[#D6B15E]/50 transition-all flex flex-col justify-between gap-4 text-[#F2F4F7]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C1F24] text-[#D6B15E] border border-[#2A2E35]">
            ECO {opening.eco} • {opening.side}
          </span>
          <span className="text-xs font-semibold text-[#4CAF7D]">{masteryPercentage}% Mastery</span>
        </div>

        <h3 className="text-lg font-bold text-[#F2F4F7]">{opening.name}</h3>
        <p className="text-xs text-[#8A919C] line-clamp-2 leading-relaxed">{opening.description}</p>
      </div>

      <div className="flex flex-col gap-3 pt-3 border-t border-[#2A2E35]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {opening.variations.map(varItem => (
            <span
              key={varItem.id}
              className="text-[11px] px-2 py-0.5 rounded bg-[#1C1F24] border border-[#2A2E35] text-[#8A919C]"
            >
              {varItem.name}
            </span>
          ))}
        </div>

        <Link
          href={`/train?openingId=${opening.id}`}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#1C1F24] hover:bg-[#D6B15E] hover:text-black border border-[#2A2E35] text-xs font-bold text-[#F2F4F7] transition-all"
        >
          <Target className="w-3.5 h-3.5" />
          Train {opening.name}
        </Link>
      </div>
    </div>
  );
};
