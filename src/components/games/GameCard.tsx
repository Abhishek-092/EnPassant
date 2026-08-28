'use client';

import React from 'react';
import Link from 'next/link';
import { CachedGame } from '@/storage/indexedDB';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { BrutalistButton } from '../ui/BrutalistButton';

interface GameCardProps {
  game: CachedGame;
  onReplayClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isWin = game.result === 'Win';

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#12151B] border border-[#242A35] hover:border-[#E5B842]/40 shadow-brutal-sm text-[#F0F3F8] gap-4 transition-all">
      <div className="flex items-center gap-4">
        {/* Platform Badge */}
        <div className="w-10 h-10 bg-[#181C24] border border-[#242A35] flex items-center justify-center text-[#E5B842] font-black text-lg">
          {game.platform === 'chesscom' ? '♟️' : game.platform === 'lichess' ? '♞' : '📜'}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm uppercase text-[#F0F3F8]">
              VS {game.userColor === 'white' ? game.blackPlayer : game.whitePlayer}
            </span>
            <BrutalistBadge variant="dark">{game.platform}</BrutalistBadge>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-medium text-[#94A0B8]">
            <span className="text-[#E5B842] font-bold">{game.openingName}</span>
            {game.variationName && <span>• {game.variationName}</span>}
            <span>• {game.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Result Badge */}
        <BrutalistBadge variant={isWin ? 'success' : 'error'}>
          {game.result}
        </BrutalistBadge>

        <Link href={`/replay?gameId=${encodeURIComponent(game.id)}`}>
          <BrutalistButton variant="outline" className="text-[11px] py-1.5 px-3">
            REPLAY & CORRECT →
          </BrutalistButton>
        </Link>
      </div>
    </div>
  );
};
