'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { GameSyncModal } from '@/components/games/GameSyncModal';
import { useAuth } from '@/firebase/auth';
import { indexedDBStorage, CachedGame, UserMistakeRecord } from '@/storage/indexedDB';
import { SessionGenerator, DailySession } from '@/training/sessionGenerator';
import {
  Target,
  RefreshCw,
  Flame,
  Award,
  AlertCircle,
  Swords,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

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
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Welcome Header & Quick Action */}
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F2F4F7]">
              Welcome back, {user?.displayName || 'Grandmaster Student'}
            </h1>
            <p className="text-xs text-[#8A919C] mt-1">
              "Learn your openings. Play your games. Train your mistakes."
            </p>
          </div>

          <button
            onClick={() => setIsSyncOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Games (Chess.com / Lichess)
          </button>
        </div>

        {/* Core Daily Training Callout Hero */}
        {session && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#15171B] via-[#1C1F24] to-[#15171B] border border-[#D6B15E]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-xl">
              <div className="flex items-center gap-2 text-[#D6B15E]">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Today's Adaptive Session
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F2F4F7]">
                {session.items.length} Custom Drills Ready ({session.estimatedMinutes} Mins)
              </h2>
              <p className="text-xs text-[#8A919C] leading-relaxed">
                Focus: <strong className="text-[#F2F4F7]">{session.focusArea}</strong>
              </p>
            </div>

            <Link
              href="/train"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D6B15E] text-black font-extrabold text-sm hover:scale-105 transition-all shadow-xl"
            >
              <Target className="w-4 h-4" />
              Continue Training
            </Link>
          </div>
        )}

        {/* Analytics & Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Opening Mastery Card */}
          <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A919C]">Opening Mastery</span>
              <Award className="w-4 h-4 text-[#D6B15E]" />
            </div>
            <div className="text-3xl font-extrabold text-[#F2F4F7]">
              {recentGames.length > 0
                ? `${Math.round((recentGames.filter(g => g.result === 'Win').length / recentGames.length) * 100)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-[#4CAF7D]">
              {recentGames.length > 0 ? `Based on ${recentGames.length} imported games` : 'Sync games to track mastery'}
            </p>
          </div>

          {/* Active Training Streak */}
          <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A919C]">Training Session Status</span>
              <Flame className="w-4 h-4 text-[#D6B15E]" />
            </div>
            <div className="text-3xl font-extrabold text-[#F2F4F7]">
              {session ? `${session.items.length} Ready` : '0 Drills'}
            </div>
            <p className="text-xs text-[#8A919C]">Daily session calculated from mistake history</p>
          </div>

          {/* Personal Game Mistakes Tracked */}
          <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A919C]">Mistakes to Correct</span>
              <AlertCircle className="w-4 h-4 text-[#D95D5D]" />
            </div>
            <div className="text-3xl font-extrabold text-[#F2F4F7]">
              {mistakes.length} Blunders
            </div>
            <p className="text-xs text-[#D95D5D]">
              {mistakes.length > 0 ? `Latest: ${mistakes[0].openingName}` : 'No game blunders detected'}
            </p>
          </div>
        </div>


        {/* Bottom Section: Recent Games & Replay Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Synced Games */}
          <div className="p-6 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#D6B15E]" />
                <h3 className="font-bold text-base text-[#F2F4F7]">Recent Real Games</h3>
              </div>
              <Link href="/games" className="text-xs text-[#D6B15E] hover:underline">
                View All
              </Link>
            </div>

            {recentGames.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8A919C] border border-dashed border-[#2A2E35] rounded-lg">
                No synced games found yet. Click "Sync Games" above to import from Chess.com or Lichess!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1C1F24] border border-[#2A2E35]"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#F2F4F7]">
                        vs {game.userColor === 'white' ? game.blackPlayer : game.whitePlayer}
                      </span>
                      <span className="text-[10px] text-[#8A919C]">
                        {game.openingName} • {game.date}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        game.result === 'Win'
                          ? 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                          : 'bg-[#D95D5D]/20 text-[#D95D5D]'
                      }`}
                    >
                      {game.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Replay & Correct Highlight */}
          <div className="p-6 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-base text-[#F2F4F7]">Replay & Correct Mode</h3>
              <p className="text-xs text-[#8A919C] leading-relaxed">
                Opening Forge pauses your real games at critical error points and gives you another chance to find the top Stockfish engine move.
              </p>
            </div>

            <Link
              href="/replay"
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#1C1F24] hover:bg-[#2A2E35] border border-[#2A2E35] text-xs font-bold text-[#D6B15E] transition-all"
            >
              Start Replaying Blunders
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <GameSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} onSyncComplete={loadData} />
    </div>
  );
}
