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
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              PLAYER DOSSIER
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              PERFORMANCE PROFILE & STATISTICAL MASTERY
            </p>
          </div>

          <BrutalistBadge variant="orange">RATING 1500</BrutalistBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrutalistCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
              <span className="font-mono text-xs font-bold uppercase text-[#94A0B8]">IDENTITY</span>
              <User className="w-4 h-4 text-[#E5B842]" />
            </div>
            <h2 className="text-2xl font-black uppercase text-[#F0F3F8]">{user?.displayName || 'STUDENT'}</h2>
            <p className="font-mono text-xs text-[#94A0B8]">{user?.email || 'OFFLINE'}</p>
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
      </main>
    </div>
  );
}
