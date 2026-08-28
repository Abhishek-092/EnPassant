'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/firebase/auth';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { User, Award, Flame } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F2F0E6] text-[#111111]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-3 border-[#111111] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#111111]">
              PLAYER DOSSIER
            </h1>
            <p className="text-xs font-mono font-bold text-[#FF4D00] uppercase tracking-wider mt-1">
              PERFORMANCE PROFILE & STATISTICAL MASTERY
            </p>
          </div>

          <BrutalistBadge variant="orange">RATING 1500</BrutalistBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#111111]">IDENTITY</span>
              <User className="w-4 h-4 text-[#FF4D00]" />
            </div>
            <h2 className="text-2xl font-black uppercase text-[#111111]">{user?.displayName || 'STUDENT'}</h2>
            <p className="font-mono text-xs font-bold text-[#111111]">{user?.email || 'OFFLINE'}</p>
          </BrutalistCard>

          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#111111]">TRAINING MASTERY</span>
              <Award className="w-4 h-4 text-[#FF4D00]" />
            </div>
            <div className="text-4xl font-black text-[#111111]">72%</div>
            <p className="text-xs font-bold text-[#19A463]">CARO-KANN ADVANCE (+8%)</p>
          </BrutalistCard>

          <BrutalistCard className="flex flex-col gap-3 bg-[#D7FF00]">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#111111]">DRILLS SOLVED</span>
              <Flame className="w-4 h-4 text-[#111111]" />
            </div>
            <div className="text-4xl font-black text-[#111111]">148</div>
            <p className="text-xs font-bold text-[#111111]">ACTIVE DRILL REPETITIONS</p>
          </BrutalistCard>
        </div>
      </main>
    </div>
  );
}
