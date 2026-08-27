'use client';

import React from 'react';
import Link from 'next/link';
import { CachedGame } from '@/storage/indexedDB';
import { Globe, Swords, CheckCircle2, ChevronRight } from 'lucide-react';

interface GameCardProps {
  game: CachedGame;
  onReplayClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onReplayClick }) => {
  const isWin = game.result === 'Win';
  const isDraw = game.result === 'Draw';

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#15171B] border border-[#2A2E35] hover:border-[#D6B15E]/40 transition-all text-[#F2F4F7] group">
      <div className="flex items-center gap-4">
        {/* Platform Badge */}
        <div className="w-10 h-10 rounded-lg bg-[#1C1F24] border border-[#2A2E35] flex items-center justify-center text-[#D6B15E] font-bold">
          {game.platform === 'chesscom' ? '♟️' : game.platform === 'lichess' ? '♞' : '📜'}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#F2F4F7]">
              vs {game.userColor === 'white' ? game.blackPlayer : game.whitePlayer}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1C1F24] border border-[#2A2E35] text-[#8A919C] capitalize">
              {game.platform}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8A919C]">
            <span className="font-medium text-[#D6B15E]">{game.openingName}</span>
            {game.variationName && <span>• {game.variationName}</span>}
            <span>• {game.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Result Badge */}
        <span
          className={`text-xs font-bold px-3 py-1 rounded-md ${
            isWin
              ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30'
              : isDraw
              ? 'bg-[#D6B15E]/10 text-[#D6B15E] border border-[#D6B15E]/30'
              : 'bg-[#D95D5D]/10 text-[#D95D5D] border border-[#D95D5D]/30'
          }`}
        >
          {game.result}
        </span>

        {/* Action Button */}
        <Link
          href={`/replay?gameId=${encodeURIComponent(game.id)}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C1F24] group-hover:bg-[#D6B15E] group-hover:text-black border border-[#2A2E35] text-xs font-semibold text-[#8A919C] transition-all"
        >
          Replay & Correct
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
