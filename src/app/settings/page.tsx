'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Settings as SettingsIcon, Cpu, Database, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 border-b border-[#2A2E35] pb-6">
          <SettingsIcon className="w-6 h-6 text-[#D6B15E]" />
          <div>
            <h1 className="text-2xl font-extrabold text-[#F2F4F7]">Application Settings</h1>
            <p className="text-xs text-[#8A919C]">
              Configure Stockfish MultiPV engine worker limits, cache storage, and training preferences.
            </p>
          </div>
        </div>

        {/* Engine Settings */}
        <div className="p-6 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#2A2E35] pb-3">
            <Cpu className="w-5 h-5 text-[#D6B15E]" />
            <h3 className="font-bold text-base text-[#F2F4F7]">Stockfish Engine Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#8A919C]">Default MultiPV Candidate Count</label>
              <select className="px-3.5 py-2 rounded-xl bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]">
                <option value="3">3 Candidate Moves (Recommended)</option>
                <option value="4">4 Candidate Moves</option>
                <option value="5">5 Candidate Moves</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#8A919C]">Target Analysis Depth</label>
              <select className="px-3.5 py-2 rounded-xl bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]">
                <option value="12">Depth 12 (Fast Browser Evaluation)</option>
                <option value="14">Depth 14 (Balanced)</option>
                <option value="16">Depth 16 (Deep Verification)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="p-6 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#2A2E35] pb-3">
            <Database className="w-5 h-5 text-[#D6B15E]" />
            <h3 className="font-bold text-base text-[#F2F4F7]">IndexedDB Offline Storage</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#F2F4F7]">Cached Engine Evaluations</p>
              <p className="text-[#8A919C]">Accelerates position lookups instantly without recalculating</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2E35] text-[#D6B15E] font-bold">
              Clear Cache
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
