'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/firebase/auth';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { User, Shield, Award, Flame, Target, Globe } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F2F0E6] text-[#111111]">
      <Sidebar />

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#8A919C]">Chess.com Username</label>
              <input
                type="text"
                value={chessCom}
                onChange={e => setChessCom(e.target.value)}
                placeholder="e.g. hikaru"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#8A919C]">Lichess Username</label>
              <input
                type="text"
                value={lichess}
                onChange={e => setLichess(e.target.value)}
                placeholder="e.g. magnuscarlsen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1F24] border border-[#2A2E35] text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
              />
            </div>
          </div>

          {savedMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#4CAF7D]/10 border border-[#4CAF7D]/30 text-xs text-[#4CAF7D]">
              <CheckCircle className="w-4 h-4" />
              {savedMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D95D5D]/10 hover:bg-[#D95D5D]/20 text-[#D95D5D] border border-[#D95D5D]/30 text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout Account
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs transition-all shadow-lg"
            >
              Save Connected Accounts
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
