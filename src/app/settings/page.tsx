'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Settings as SettingsIcon, Cpu, Database } from 'lucide-react';

export default function SettingsPage() {
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
          <div className="flex items-center gap-2 border-b border-[#242A35] pb-3">
            <Cpu className="w-5 h-5 text-[#E5B842]" />
            <h3 className="font-extrabold text-base uppercase text-[#F0F3F8]">Stockfish Engine Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Default MultiPV Candidate Count</label>
              <select className="px-3.5 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] focus:outline-none focus:border-[#E5B842] font-mono">
                <option value="3">3 Candidate Moves (Recommended)</option>
                <option value="4">4 Candidate Moves</option>
                <option value="5">5 Candidate Moves</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Target Analysis Depth</label>
              <select className="px-3.5 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] focus:outline-none focus:border-[#E5B842] font-mono">
                <option value="12">Depth 12 (Fast Browser Evaluation)</option>
                <option value="16">Depth 16 (Balanced Training)</option>
                <option value="20">Depth 20 (Deep Verification)</option>
              </select>
            </div>
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
              <p className="font-bold text-[#F0F3F8]">Cached Engine Evaluations</p>
              <p className="text-[#94A0B8]">Accelerates position lookups instantly without recalculating</p>
            </div>
            <BrutalistButton variant="outline" className="text-[11px] py-1.5 px-3">
              Clear Cache
            </BrutalistButton>
          </div>
        </BrutalistCard>
      </main>
    </div>
  );
}
