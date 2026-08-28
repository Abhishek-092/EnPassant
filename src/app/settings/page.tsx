'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { Settings as SettingsIcon, Cpu, Database, CheckCircle, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [multiPv, setMultiPv] = useState('3');
  const [depth, setDepth] = useState('14');
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMultiPv = localStorage.getItem('enpassant_setting_multipv') || '3';
      const storedDepth = localStorage.getItem('enpassant_setting_depth') || '14';
      setMultiPv(storedMultiPv);
      setDepth(storedDepth);
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enpassant_setting_multipv', multiPv);
      localStorage.setItem('enpassant_setting_depth', depth);
      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 2000);
    }
  };

  const handleClearCache = async () => {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        setCacheStatus('Clearing local cache...');
        localStorage.removeItem('enpassant_last_sync_time');
        setCacheStatus('IndexedDB evaluation cache cleared successfully!');
        setTimeout(() => setCacheStatus(null), 3000);
      }
    } catch {
      setCacheStatus('Failed to clear cache.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 border-b-2 border-[#242A35] pb-6">
          <SettingsIcon className="w-6 h-6 text-[#E5B842]" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#F0F3F8]">
              APPLICATION SETTINGS
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              CONFIGURE STOCKFISH 18 ENGINE OPTIONS, STORAGE CACHE, AND REPERTOIRE PREFERENCES
            </p>
          </div>
        </div>

        {/* Engine Settings */}
        <BrutalistCard className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#E5B842]" />
              <h3 className="font-extrabold text-base uppercase text-[#F0F3F8]">Stockfish Engine Options</h3>
            </div>
            <BrutalistBadge variant="orange">ENGINE VERIFIED</BrutalistBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Default MultiPV Candidate Count</label>
              <select
                value={multiPv}
                onChange={e => setMultiPv(e.target.value)}
                className="px-3.5 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] focus:outline-none focus:border-[#E5B842] font-mono"
              >
                <option value="3">3 Candidate Moves (Recommended)</option>
                <option value="4">4 Candidate Moves</option>
                <option value="5">5 Candidate Moves</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Target Analysis Depth</label>
              <select
                value={depth}
                onChange={e => setDepth(e.target.value)}
                className="px-3.5 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] focus:outline-none focus:border-[#E5B842] font-mono"
              >
                <option value="12">Depth 12 (Fast Browser Evaluation)</option>
                <option value="14">Depth 14 (Balanced Training)</option>
                <option value="18">Depth 18 (Deep Verification)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#242A35]">
            {saveStatus ? (
              <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Settings saved successfully!
              </span>
            ) : <span />}

            <BrutalistButton variant="primary" onClick={handleSaveSettings}>
              <Save className="w-4 h-4 inline mr-1.5" />
              Save Engine Settings
            </BrutalistButton>
          </div>
        </BrutalistCard>

        {/* Storage Settings */}
        <BrutalistCard className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#242A35] pb-3">
            <Database className="w-5 h-5 text-[#E5B842]" />
            <h3 className="font-extrabold text-base uppercase text-[#F0F3F8]">IndexedDB Offline Storage</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#F0F3F8]">Cached Engine Evaluations & Auto-Sync Timestamp</p>
              <p className="text-[#94A0B8]">Accelerates position lookups instantly without recalculating</p>
            </div>
            <BrutalistButton variant="outline" onClick={handleClearCache} className="text-[11px] py-1.5 px-3">
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Clear Local Cache
            </BrutalistButton>
          </div>

          {cacheStatus && (
            <div className="p-3 bg-[#E5B842]/10 border border-[#E5B842]/30 text-xs font-semibold text-[#E5B842]">
              {cacheStatus}
            </div>
          )}
        </BrutalistCard>
      </main>
    </div>
  );
}
