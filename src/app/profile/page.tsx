'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/firebase/auth';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { User, Award, Flame, Globe, Save, CheckCircle, LogIn, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUserConnections, updateProfileName, signInWithGoogle, logout } = useAuth();
  const [nameInput, setNameInput] = useState('');
  const [chessComInput, setChessComInput] = useState('');
  const [lichessInput, setLichessInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setAuthLoading(false);
    }
  };

  const isGuest = !user || user.uid.startsWith('guest_') || user.uid.startsWith('demo_');

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              PLAYER PROFILE & AUTHENTICATION
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              CONNECT GOOGLE AUTH & SYNC YOUR CHESS REPERTOIRE
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isGuest ? (
              <BrutalistButton variant="primary" onClick={handleGoogleSignIn} disabled={authLoading}>
                <LogIn className="w-4 h-4 inline mr-1.5" />
                {authLoading ? 'Signing In...' : 'Sign In with Google'}
              </BrutalistButton>
            ) : (
              <BrutalistButton variant="outline" onClick={() => logout()}>
                <LogOut className="w-4 h-4 inline mr-1.5" />
                Sign Out ({user.displayName?.split(' ')[0]})
              </BrutalistButton>
            )}
          </div>
        </div>

        {/* Authentication Status Banner */}
        <BrutalistCard className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isGuest ? 'border-[#E5B842]/50 bg-gradient-to-br from-[#181C24] to-[#12151B]' : 'border-[#10B981]/40'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 flex items-center justify-center font-black text-xl border ${isGuest ? 'bg-[#181C24] border-[#E5B842] text-[#E5B842]' : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'}`}>
              {isGuest ? '👤' : '✓'}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base uppercase text-[#F0F3F8]">
                  {isGuest ? 'Guest / Local Mode' : `Google Account: ${user.email}`}
                </span>
                <BrutalistBadge variant={isGuest ? 'orange' : 'success'}>
                  {isGuest ? 'LOCAL PERSISTENCE' : 'FIREBASE CLOUD SYNC'}
                </BrutalistBadge>
              </div>
              <p className="text-xs text-[#94A0B8] mt-0.5">
                {isGuest
                  ? 'Sign in with your Google account to automatically back up your Chess.com and Lichess handles across devices.'
                  : 'Your profile and connected platform handles are securely backed up in Google Firebase Firestore.'}
              </p>
            </div>
          </div>

          {isGuest && (
            <BrutalistButton variant="primary" onClick={handleGoogleSignIn} disabled={authLoading}>
              <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Connect Google Account
            </BrutalistButton>
          )}
        </BrutalistCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#94A0B8]">IDENTITY</span>
              <User className="w-4 h-4 text-[#E5B842]" />
            </div>
            <h2 className="text-2xl font-black uppercase text-[#F0F3F8]">{user?.displayName || 'STUDENT'}</h2>
            <p className="font-mono text-xs text-[#94A0B8]">{user?.email || 'LOCAL PROFILE'}</p>
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
                Connected Chess.com & Lichess Usernames
              </h3>
            </div>
            <BrutalistBadge variant="dark">AUTO-SYNC ENABLED</BrutalistBadge>
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
                  Usernames saved & auto-synced to your profile!
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
