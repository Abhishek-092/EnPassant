'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GameCard } from '@/components/games/GameCard';
import { GameSyncModal } from '@/components/games/GameSyncModal';
import { indexedDBStorage, CachedGame } from '@/storage/indexedDB';
import { autoSyncManager } from '@/services/autoSyncService';
import { useAuth } from '@/firebase/auth';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Swords, ChevronDown, RefreshCw } from 'lucide-react';

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<CachedGame[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'chesscom' | 'lichess' | 'pgn'>('all');
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreNote, setLoadMoreNote] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
    setHasMore(autoSyncManager.hasMoreGames());
  }, []);

  const loadGames = async () => {
    const loaded = await indexedDBStorage.getGames();
    // Newest first by import time, falling back to insertion order.
    setGames([...loaded].sort((a, b) => b.importedAt - a.importedAt));
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadMoreNote(null);

    const result = await autoSyncManager.loadMoreGames(
      user?.chessComUsername,
      user?.lichessUsername
    );

    await loadGames();
    setHasMore(autoSyncManager.hasMoreGames());
    setIsLoadingMore(false);

    if (result.error) {
      setLoadMoreNote(result.error);
    } else if (result.count === 0) {
      setLoadMoreNote('No older games found — you have reached the start of your history.');
    } else {
      setLoadMoreNote(`Loaded ${result.count} older games.`);
    }
  };

  const filteredGames = games.filter(g => {
    const matchesTab = activeTab === 'all' || g.platform === activeTab;
    const matchesSearch =
      g.whitePlayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.blackPlayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.openingName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const canLoadMore = Boolean(user?.chessComUsername || user?.lichessUsername);

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              MATCH ARCHIVE
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              SYNCHRONIZED GAMES FROM CHESS.COM, LICHESS, AND PGN UPLOADS
            </p>
          </div>

          <BrutalistButton variant="primary" onClick={() => setIsSyncOpen(true)}>
            ⚡ SYNC LATEST GAMES
          </BrutalistButton>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-[#12151B] border-2 border-[#242A35] p-1 font-mono text-xs shadow-brutal-sm w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-[#181C24] text-[#E5B842] border border-[#E5B842]' : 'text-[#94A0B8] hover:text-[#F0F3F8]'
              }`}
            >
              ALL ({games.length})
            </button>
            <button
              onClick={() => setActiveTab('chesscom')}
              className={`px-4 py-2 font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'chesscom' ? 'bg-[#181C24] text-[#E5B842] border border-[#E5B842]' : 'text-[#94A0B8] hover:text-[#F0F3F8]'
              }`}
            >
              CHESS.COM
            </button>
            <button
              onClick={() => setActiveTab('lichess')}
              className={`px-4 py-2 font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'lichess' ? 'bg-[#181C24] text-[#E5B842] border border-[#E5B842]' : 'text-[#94A0B8] hover:text-[#F0F3F8]'
              }`}
            >
              LICHESS
            </button>
            <button
              onClick={() => setActiveTab('pgn')}
              className={`px-4 py-2 font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'pgn' ? 'bg-[#181C24] text-[#E5B842] border border-[#E5B842]' : 'text-[#94A0B8] hover:text-[#F0F3F8]'
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
              className="w-full px-4 py-2.5 bg-[#12151B] border-2 border-[#242A35] text-xs font-bold uppercase tracking-wider text-[#F0F3F8] shadow-brutal-sm focus:outline-none focus:border-[#E5B842]"
            />
          </div>
        </div>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-[#94A0B8] border-2 border-dashed border-[#242A35] bg-[#12151B] flex flex-col items-center gap-3">
            <Swords className="w-8 h-8 text-[#E5B842]" />
            <p className="font-extrabold text-sm uppercase text-[#F0F3F8]">NO MATCHES FOUND IN THIS TAB</p>
            <p className="text-[#94A0B8]">CONNECT CHESS.COM OR LICHESS ACCOUNTS TO LOAD GAMES AUTOMATICALLY.</p>
            <BrutalistButton variant="primary" onClick={() => setIsSyncOpen(true)} className="mt-2">
              CONNECT ACCOUNTS
            </BrutalistButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}

            {/* Load older history on demand */}
            <div className="flex flex-col items-center gap-2 pt-4">
              {loadMoreNote && (
                <p className="font-mono text-[11px] font-bold text-[#E5B842] uppercase tracking-wider">
                  {loadMoreNote}
                </p>
              )}

              <p className="font-mono text-[11px] text-[#94A0B8] uppercase tracking-wider">
                SHOWING {filteredGames.length} OF {games.length} STORED GAMES
              </p>

              {canLoadMore && hasMore && (
                <BrutalistButton
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="mt-1"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1.5 animate-spin" />
                      LOADING OLDER GAMES...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 inline mr-1.5" />
                      LOAD MORE GAMES
                    </>
                  )}
                </BrutalistButton>
              )}

              {canLoadMore && !hasMore && games.length > 0 && (
                <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                  END OF AVAILABLE HISTORY
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <GameSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} onSyncComplete={loadGames} />
    </div>
  );
}
