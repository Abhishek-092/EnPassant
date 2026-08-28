'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GameCard } from '@/components/games/GameCard';
import { GameSyncModal } from '@/components/games/GameSyncModal';
import { indexedDBStorage, CachedGame } from '@/storage/indexedDB';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { Swords, Search } from 'lucide-react';

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
    <div className="flex min-h-screen bg-[#F2F0E6] text-[#111111]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-3 border-[#111111] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#111111]">
              MATCH ARCHIVE
            </h1>
            <p className="text-xs font-mono font-bold text-[#FF4D00] uppercase tracking-wider mt-1">
              SYNCHRONIZED GAMES FROM CHESS.COM, LICHESS, AND PGN UPLOADS
            </p>
          </div>

          <BrutalistButton variant="primary" onClick={() => setIsSyncOpen(true)}>
            ⚡ SYNC LATEST GAMES
          </BrutalistButton>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-white border-3 border-[#111111] p-1 font-mono text-xs shadow-brutal-sm w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                activeTab === 'all' ? 'bg-[#FF4D00] text-[#111111]' : 'text-[#111111] hover:bg-[#F2F0E6]'
              }`}
            >
              ALL ({games.length})
            </button>
            <button
              onClick={() => setActiveTab('chesscom')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                activeTab === 'chesscom' ? 'bg-[#FF4D00] text-[#111111]' : 'text-[#111111] hover:bg-[#F2F0E6]'
              }`}
            >
              CHESS.COM
            </button>
            <button
              onClick={() => setActiveTab('lichess')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                activeTab === 'lichess' ? 'bg-[#FF4D00] text-[#111111]' : 'text-[#111111] hover:bg-[#F2F0E6]'
              }`}
            >
              LICHESS
            </button>
            <button
              onClick={() => setActiveTab('pgn')}
              className={`px-4 py-2 font-bold uppercase transition-all ${
                activeTab === 'pgn' ? 'bg-[#FF4D00] text-[#111111]' : 'text-[#111111] hover:bg-[#F2F0E6]'
              }`}
            >
              PGN
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="SEARCH OPPONENT OR OPENING..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-3 border-[#111111] text-xs font-bold uppercase tracking-wider text-[#111111] shadow-brutal-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-[#111111] border-3 border-dashed border-[#111111] bg-white flex flex-col items-center gap-3">
            <Swords className="w-8 h-8 text-[#FF4D00]" />
            <p className="font-black text-base uppercase">NO MATCHES FOUND IN THIS TAB</p>
            <p className="text-[#111111]">CONNECT CHESS.COM OR LICHESS ACCOUNTS TO LOAD GAMES AUTOMATICALLY.</p>
            <BrutalistButton variant="primary" onClick={() => setIsSyncOpen(true)} className="mt-2">
              CONNECT ACCOUNTS
            </BrutalistButton>
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

