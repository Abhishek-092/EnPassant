'use client';

import React, { useState } from 'react';
import { useAuth } from '@/firebase/auth';
import { ChessComProvider } from '@/providers/ChessComProvider';
import { LichessProvider } from '@/providers/LichessProvider';
import { PGNProvider } from '@/providers/PGNProvider';
import { analysisOrchestrator } from '@/analysis/analysisOrchestrator';
import { Globe, RefreshCw, FileText, CheckCircle } from 'lucide-react';

interface GameSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const GameSyncModal: React.FC<GameSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const { user, updateUserConnections } = useAuth();
  const [chessComInput, setChessComInput] = useState(user?.chessComUsername || '');
  const [lichessInput, setLichessInput] = useState(user?.lichessUsername || '');
  const [pgnInput, setPgnInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncStatus('Connecting to chess platforms...');

    updateUserConnections(chessComInput, lichessInput);

    let importedTotal = 0;

    // 1. Sync Chess.com
    if (chessComInput.trim()) {
      setSyncStatus(`Fetching recent Chess.com games for ${chessComInput}...`);
      const provider = new ChessComProvider();
      const games = await provider.fetchGames(chessComInput.trim());
      for (const game of games) {
        await analysisOrchestrator.analyzeGame(game);
        importedTotal++;
      }
    }

    // 2. Sync Lichess
    if (lichessInput.trim()) {
      setSyncStatus(`Fetching recent Lichess games for ${lichessInput}...`);
      const provider = new LichessProvider();
      const games = await provider.fetchGames(lichessInput.trim());
      for (const game of games) {
        await analysisOrchestrator.analyzeGame(game);
        importedTotal++;
      }
    }

    // 3. Sync Manual PGN if provided
    if (pgnInput.trim()) {
      setSyncStatus('Parsing manual PGN...');
      const game = PGNProvider.parsePgn(pgnInput.trim());
      if (game) {
        await analysisOrchestrator.analyzeGame(game);
        importedTotal++;
      }
    }

    setSyncing(false);
    setSyncStatus(`Sync Complete! Imported & analyzed ${importedTotal} new games.`);

    if (onSyncComplete) onSyncComplete();
    setTimeout(() => {
      onClose();
      setSyncStatus(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#15171B] border border-[#2A2E35] p-6 text-[#F2F4F7] shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-3">
          <div className="flex items-center gap-2 text-[#D6B15E]">
            <Globe className="w-5 h-5" />
            <h3 className="font-bold text-lg">Synchronize Real Games</h3>
          </div>
          <button onClick={onClose} className="text-[#8A919C] hover:text-[#F2F4F7] text-sm">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Chess.com Binding */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8A919C]">Chess.com Username</label>
            <input
              type="text"
              value={chessComInput}
              onChange={e => setChessComInput(e.target.value)}
              placeholder="e.g. hikaru"
              className="w-full px-3.5 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
            />
          </div>

          {/* Lichess Binding */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8A919C]">Lichess Username</label>
            <input
              type="text"
              value={lichessInput}
              onChange={e => setLichessInput(e.target.value)}
              placeholder="e.g. magnuscarlsen"
              className="w-full px-3.5 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
            />
          </div>

          {/* PGN Paste Fallback */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#8A919C] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Paste PGN (Optional Fallback)
            </label>
            <textarea
              rows={3}
              value={pgnInput}
              onChange={e => setPgnInput(e.target.value)}
              placeholder="Paste raw PGN text here..."
              className="w-full px-3 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] font-mono text-[11px] focus:outline-none focus:border-[#D6B15E]"
            />
          </div>
        </div>

        {syncStatus && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#D6B15E]/10 border border-[#D6B15E]/30 text-xs text-[#D6B15E]">
            <CheckCircle className="w-4 h-4" />
            {syncStatus}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#2A2E35] text-xs font-semibold text-[#8A919C] hover:bg-[#1C1F24]"
          >
            Cancel
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs transition-all shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing...' : 'Sync Latest Games'}
          </button>
        </div>
      </div>
    </div>
  );
};
