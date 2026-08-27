'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GameCard } from '@/components/games/GameCard';
import { GameSyncModal } from '@/components/games/GameSyncModal';
import { indexedDBStorage, CachedGame } from '@/storage/indexedDB';
import { Swords, RefreshCw, Upload, Search } from 'lucide-react';

export default function GamesPage() {
  const [games, setGames] = useState<CachedGame[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'chesscom' | 'lichess' | 'pgn'>('all');
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const loaded = await indexedDBStorage.getGames();
    setGames(loaded.reverse());
  };

  const filteredGames = games.filter(g => {
    const matchesTab = activeTab === 'all' || g.platform === activeTab;
    const matchesSearch =
      g.whitePlayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.blackPlayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.openingName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#2A2E35] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F2F4F7]">Personal Games</h1>
            <p className="text-xs text-[#8A919C] mt-1">
              Synchronized games from Chess.com, Lichess, and PGN uploads with automated mistake analysis.
            </p>
          </div>

          <button
            onClick={() => setIsSyncOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Latest Games
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-[#15171B] border border-[#2A2E35] rounded-xl p-1 text-xs w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'all' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
              }`}
            >
              All ({games.length})
            </button>
            <button
              onClick={() => setActiveTab('chesscom')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'chesscom' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
              }`}
            >
              Chess.com
            </button>
            <button
              onClick={() => setActiveTab('lichess')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'lichess' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
              }`}
            >
              Lichess
            </button>
            <button
              onClick={() => setActiveTab('pgn')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'pgn' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
              }`}
            >
              Uploaded PGN
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#8A919C] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search opponent or opening..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#15171B] border border-[#2A2E35] text-xs text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
            />
          </div>
        </div>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8A919C] border border-dashed border-[#2A2E35] rounded-xl flex flex-col items-center gap-3">
            <Swords className="w-8 h-8 text-[#D6B15E]" />
            <p className="font-semibold text-sm text-[#F2F4F7]">No synced games in this tab yet</p>
            <p>Connect your Chess.com or Lichess account to load games automatically.</p>
            <button
              onClick={() => setIsSyncOpen(true)}
              className="mt-2 px-4 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-xs font-bold text-[#D6B15E]"
            >
              Connect Accounts
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>

      <GameSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} onSyncComplete={loadGames} />
    </div>
  );
}
