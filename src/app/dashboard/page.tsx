'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { GameSyncModal } from '@/components/games/GameSyncModal';
import { useAuth } from '@/firebase/auth';
import { indexedDBStorage, CachedGame, UserMistakeRecord } from '@/storage/indexedDB';
import { SessionGenerator, DailySession } from '@/training/sessionGenerator';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { Flame, Award, AlertCircle, Swords, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [session, setSession] = useState<DailySession | null>(null);
  const [recentGames, setRecentGames] = useState<CachedGame[]>([]);
  const [mistakes, setMistakes] = useState<UserMistakeRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const daily = await SessionGenerator.generateDailySession();
    setSession(daily);

    const games = await indexedDBStorage.getGames();
    setRecentGames(games.slice(-4).reverse());

    const mistakeList = await indexedDBStorage.getMistakes();
    setMistakes(mistakeList);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              COMMAND CENTER
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              STUDENT: {user?.displayName || 'GRANDMASTER STUDENT'}
            </p>
          </div>

          <BrutalistButton variant="primary" onClick={() => setIsSyncOpen(true)}>
            ⚡ SYNC REAL GAMES
          </BrutalistButton>
        </div>

        {/* Hero Banner Callout */}
        {session && (
          <div className="p-6 bg-gradient-to-br from-[#181C24] to-[#12151B] text-[#F0F3F8] border-2 border-[#E5B842]/50 shadow-brutal-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-xl">
              <div className="flex items-center gap-2">
                <BrutalistBadge variant="orange">TODAY'S ADAPTIVE SESSION</BrutalistBadge>
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#F0F3F8]">
                {session.items.length} POSITIONS READY ({session.estimatedMinutes} MINS)
              </h2>
              <p className="text-xs font-semibold text-[#94A0B8] uppercase tracking-wider">
                FOCUS: <span className="text-[#E5B842]">{session.focusArea}</span>
              </p>
            </div>

            <Link href="/train">
              <BrutalistButton variant="primary" className="text-sm py-3 px-6">
                START TRAINING →
              </BrutalistButton>
            </Link>
          </div>
        )}

        {/* Overview Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrutalistCard>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#94A0B8]">
                WIN RATE MASTERY
              </span>
              <Award className="w-5 h-5 text-[#E5B842]" />
            </div>
            <div className="text-3xl font-black text-[#F0F3F8]">
              {recentGames.length > 0
                ? `${Math.round((recentGames.filter(g => g.result === 'Win').length / recentGames.length) * 100)}%`
                : 'N/A'}
            </div>
            <p className="text-xs font-semibold text-[#10B981] mt-1">
              {recentGames.length > 0 ? `BASED ON ${recentGames.length} REAL GAMES` : 'SYNC GAMES TO TRACK'}
            </p>
          </BrutalistCard>

          <BrutalistCard>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#94A0B8]">
                TRAINING SESSION
              </span>
              <Flame className="w-5 h-5 text-[#E5B842]" />
            </div>
            <div className="text-3xl font-black text-[#F0F3F8]">
              {session ? `${session.items.length} DRILLS` : '0 DRILLS'}
            </div>
            <p className="text-xs font-semibold text-[#94A0B8] mt-1">ADAPTIVE DRILL QUEUE READY</p>
          </BrutalistCard>

          <BrutalistCard>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#94A0B8]">
                GAME BLUNDERS
              </span>
              <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div className="text-3xl font-black text-[#EF4444]">{mistakes.length}</div>
            <p className="text-xs font-semibold text-[#EF4444] mt-1">
              {mistakes.length > 0 ? `LATEST: ${mistakes[0].openingName}` : 'NO UNRESOLVED BLUNDERS'}
            </p>
          </BrutalistCard>
        </div>

        {/* Recent Games & Replay Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BrutalistCard className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#E5B842]" />
                <h3 className="font-extrabold text-base uppercase tracking-tight text-[#F0F3F8]">
                  RECENT REAL GAMES
                </h3>
              </div>
              <Link href="/games" className="font-bold text-xs uppercase text-[#E5B842] hover:underline">
                VIEW ALL →
              </Link>
            </div>

            {recentGames.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-[#94A0B8] border border-dashed border-[#242A35] bg-[#0B0D10]">
                NO GAMES SYNCED YET. CLICK "SYNC REAL GAMES" ABOVE TO IMPORT FROM CHESS.COM OR LICHESS.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3.5 bg-[#181C24] border border-[#242A35] font-mono text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[#F0F3F8]">
                        VS {game.userColor === 'white' ? game.blackPlayer : game.whitePlayer}
                      </span>
                      <span className="text-[10px] text-[#94A0B8]">
                        {game.openingName} • {game.date}
                      </span>
                    </div>
                    <BrutalistBadge variant={game.result === 'Win' ? 'success' : 'error'}>
                      {game.result}
                    </BrutalistBadge>
                  </div>
                ))}
              </div>
            )}
          </BrutalistCard>

          <BrutalistCard className="flex flex-col justify-between gap-4 border-[#E5B842]/40 bg-gradient-to-br from-[#181C24] to-[#12151B]">
            <div className="flex flex-col gap-2">
              <BrutalistBadge variant="orange">REPLAY & CORRECT MODE</BrutalistBadge>
              <h3 className="text-xl md:text-2xl font-black uppercase text-[#F0F3F8]">
                TURN GAME BLUNDERS INTO INSTINCT
              </h3>
              <p className="text-xs font-medium text-[#94A0B8] leading-relaxed">
                EnPassant isolates your real game blunders and gives you another chance to find top Stockfish 18 moves.
              </p>
            </div>

            <Link href="/replay">
              <BrutalistButton variant="primary" className="w-full">
                REPLAY MISTAKES →
              </BrutalistButton>
            </Link>
          </BrutalistCard>
        </div>
      </main>

      <GameSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} onSyncComplete={loadData} />
    </div>
  );
}
