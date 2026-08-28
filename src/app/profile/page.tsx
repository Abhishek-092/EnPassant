'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/firebase/auth';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { User, Award, Flame, Globe, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUserConnections, updateProfileName } = useAuth();
  const [nameInput, setNameInput] = useState('');
  const [chessComInput, setChessComInput] = useState('');
  const [lichessInput, setLichessInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setNameInput(user.displayName || '');
      setChessComInput(user.chessComUsername || '');
      setLichessInput(user.lichessUsername || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (nameInput.trim()) {
      await updateProfileName(nameInput);
    }
    await updateUserConnections(chessComInput, lichessInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              PLAYER DOSSIER & CONNECTED ACCOUNTS
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              AUTOMATICALLY SYNC AND TRACK YOUR OPENING REPERTOIRE ACROSS CHESS SITES
            </p>
          </div>

          <BrutalistBadge variant="orange">RATING {user?.rating || 1500}</BrutalistBadge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#94A0B8]">IDENTITY</span>
              <User className="w-4 h-4 text-[#E5B842]" />
            </div>
            <h2 className="text-2xl font-black uppercase text-[#F0F3F8]">{user?.displayName || 'STUDENT'}</h2>
            <p className="font-mono text-xs text-[#94A0B8]">{user?.email || 'LOCAL / OFFLINE'}</p>
          </BrutalistCard>

          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#94A0B8]">TRAINING MASTERY</span>
              <Award className="w-4 h-4 text-[#E5B842]" />
            </div>
            <div className="text-3xl font-black text-[#F0F3F8]">72%</div>
            <p className="text-xs font-semibold text-[#10B981]">CARO-KANN ADVANCE (+8%)</p>
          </BrutalistCard>

          <BrutalistCard className="flex flex-col gap-3 border-[#E5B842]/40 bg-gradient-to-br from-[#181C24] to-[#12151B]">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#E5B842]">DRILLS SOLVED</span>
              <Flame className="w-4 h-4 text-[#E5B842]" />
            </div>
            <div className="text-3xl font-black text-[#F0F3F8]">148</div>
            <p className="text-xs font-semibold text-[#94A0B8]">ACTIVE DRILL REPETITIONS</p>
          </BrutalistCard>
        </div>

        {/* Account Bindings */}
        <BrutalistCard className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
            <div className="flex items-center gap-2 text-[#E5B842]">
              <Globe className="w-5 h-5" />
              <h3 className="font-extrabold text-base uppercase text-[#F0F3F8]">
                Connected Chess.com & Lichess Accounts
              </h3>
            </div>
            <BrutalistBadge variant="dark">PERSISTENT AUTO-SYNC</BrutalistBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Grandmaster Student"
                className="w-full px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] focus:outline-none focus:border-[#E5B842]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Chess.com Username</label>
              <input
                type="text"
                value={chessComInput}
                onChange={e => setChessComInput(e.target.value)}
                placeholder="e.g. hikaru"
                className="w-full px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono focus:outline-none focus:border-[#E5B842]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#94A0B8]">Lichess Username</label>
              <input
                type="text"
                value={lichessInput}
                onChange={e => setLichessInput(e.target.value)}
                placeholder="e.g. magnuscarlsen"
                className="w-full px-3.5 py-2.5 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono focus:outline-none focus:border-[#E5B842]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {isSaved && (
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Usernames saved & auto-synced successfully!
                </span>
              )}
            </div>

            <BrutalistButton variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 inline mr-1.5" />
              Save Account Connections
            </BrutalistButton>
          </div>
        </BrutalistCard>
      </main>
    </div>
  );
}
