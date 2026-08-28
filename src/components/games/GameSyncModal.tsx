'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/auth';
import { PGNProvider } from '@/providers/PGNProvider';
import { analysisOrchestrator } from '@/analysis/analysisOrchestrator';
import { BrutalistButton } from '../ui/BrutalistButton';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { Globe, RefreshCw, FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
  const { user, updateUserConnections, triggerAutoSync } = useAuth();
  const [chessComInput, setChessComInput] = useState('');
  const [lichessInput, setLichessInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setChessComInput(user.chessComUsername || '');
      setLichessInput(user.lichessUsername || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncStatus('Saving connected usernames & fetching games...');
    setErrorStatus(null);

    // Save usernames persistently to both local storage & Firestore
    await updateUserConnections(chessComInput, lichessInput);

    let importedTotal = 0;

    // 1. Sync through autoSyncManager
    const result = await triggerAutoSync(true);
    importedTotal += result.count;
    if (result.error) {
      setErrorStatus(result.error);
    }

    // 2. Parse manual PGN if provided
    if (pgnInput.trim()) {
      setSyncStatus('Parsing manual PGN file...');
      const game = PGNProvider.parsePgn(pgnInput.trim());
      if (game) {
        await analysisOrchestrator.analyzeGame(game);
        importedTotal++;
      }
    }

    setSyncing(false);
    setSyncStatus(`Sync Complete! Synced & analyzed ${importedTotal} new games.`);

    if (onSyncComplete) onSyncComplete();
    setTimeout(() => {
      onClose();
      setSyncStatus(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#12151B] border-2 border-[#242A35] shadow-brutal-lg p-6 text-[#F0F3F8] flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[#242A35] pb-4">
          <div className="flex items-center gap-2 text-[#E5B842]">
            <Globe className="w-5 h-5" />
            <h3 className="font-extrabold text-base uppercase tracking-wider">Synchronize Real Games</h3>
          </div>
          <button onClick={onClose} className="text-[#94A0B8] hover:text-[#F0F3F8] font-bold text-sm cursor-pointer">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Chess.com Username */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#94A0B8]">Chess.com Username</label>
              <BrutalistBadge variant="dark">AUTO-SAVED</BrutalistBadge>
            </div>
            <input
              type="text"
              value={chessComInput}
              onChange={e => setChessComInput(e.target.value)}
              placeholder="e.g. hikaru"
              className="w-full px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono focus:outline-none focus:border-[#E5B842]"
            />
          </div>

          {/* Lichess Username */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#94A0B8]">Lichess Username</label>
              <BrutalistBadge variant="dark">AUTO-SAVED</BrutalistBadge>
            </div>
            <input
              type="text"
              value={lichessInput}
              onChange={e => setLichessInput(e.target.value)}
              placeholder="e.g. magnuscarlsen"
              className="w-full px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono focus:outline-none focus:border-[#E5B842]"
            />
          </div>

          {/* PGN Paste Fallback */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#94A0B8] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#E5B842]" />
              Paste PGN (Optional Fallback)
            </label>
            <textarea
              rows={3}
              value={pgnInput}
              onChange={e => setPgnInput(e.target.value)}
              placeholder="Paste raw PGN text here..."
              className="w-full px-3 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono text-[11px] focus:outline-none focus:border-[#E5B842]"
            />
          </div>
        </div>

        {syncStatus && (
          <div className="flex items-center gap-2 p-3 bg-[#E5B842]/10 border border-[#E5B842]/30 text-xs font-semibold text-[#E5B842]">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {syncStatus}
          </div>
        )}

        {errorStatus && (
          <div className="flex items-center gap-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-semibold text-[#F87171]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorStatus}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <BrutalistButton variant="outline" onClick={onClose}>
            Cancel
          </BrutalistButton>
          <BrutalistButton
            variant="primary"
            onClick={handleSyncAll}
            disabled={syncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing...' : 'Save & Sync Games'}
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
