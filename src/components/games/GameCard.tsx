'use client';

import React from 'react';
import Link from 'next/link';
import { CachedGame } from '@/storage/indexedDB';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { BrutalistButton } from '../ui/BrutalistButton';
import { ChevronRight } from 'lucide-react';

interface GameCardProps {
  game: CachedGame;
  onReplayClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isWin = game.result === 'Win';

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border-3 border-[#111111] shadow-brutal-sm text-[#111111] gap-4">
      <div className="flex items-center gap-4">
        {/* Platform Badge */}
        <div className="w-10 h-10 bg-[#FF4D00] border-2 border-[#111111] flex items-center justify-center text-black font-black text-lg">
          {game.platform === 'chesscom' ? '♟️' : game.platform === 'lichess' ? '♞' : '📜'}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm uppercase text-[#111111]">
              VS {game.userColor === 'white' ? game.blackPlayer : game.whitePlayer}
            </span>
            <BrutalistBadge variant="dark">{game.platform}</BrutalistBadge>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#111111]">
            <span className="text-[#FF4D00]">{game.openingName}</span>
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

