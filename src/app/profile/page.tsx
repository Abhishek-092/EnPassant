'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/firebase/auth';
import { User, Award, Globe, LogOut, CheckCircle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUserConnections, logout } = useAuth();
  const [chessCom, setChessCom] = useState(user?.chessComUsername || '');
  const [lichess, setLichess] = useState(user?.lichessUsername || '');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    updateUserConnections(chessCom, lichess);
    setSavedMessage('Connected accounts updated successfully!');
    setTimeout(() => setSavedMessage(null), 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-[#2A2E35] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#D6B15E] to-[#B38E3F] flex items-center justify-center font-bold text-black text-xl shadow-lg">
              ♟️
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#F2F4F7]">
                {user?.displayName || 'Grandmaster Student'}
              </h1>
              <p className="text-xs text-[#8A919C]">{user?.email || 'student@openingforge.com'}</p>
            </div>
          </div>

          <span className="text-xs px-3 py-1.5 rounded-full bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30 font-semibold">
            Active Premium Student
          </span>
        </div>

        {/* Rating & Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A919C]">Approximate Rating</span>
              <Award className="w-4 h-4 text-[#D6B15E]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F2F4F7]">1600 Elo</div>
            <p className="text-xs text-[#8A919C]">Used to scale analysis explanations</p>
          </div>

          <div className="p-5 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A919C]">Preferred Side</span>
              <Shield className="w-4 h-4 text-[#D6B15E]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F2F4F7]">White & Black (Both)</div>
            <p className="text-xs text-[#8A919C]">Adaptive drills generated for both sides</p>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="p-6 rounded-xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-[#2A2E35] pb-3">
            <Globe className="w-5 h-5 text-[#D6B15E]" />
            <h3 className="font-bold text-base text-[#F2F4F7]">Connected Chess Accounts</h3>
          </div>

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
