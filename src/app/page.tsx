'use client';

import React from 'react';
import Link from 'next/link';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0D10] flex flex-col justify-between p-8 text-[#F0F3F8]">
      <header className="flex items-center justify-between max-w-7xl mx-auto w-full border-b border-[#242A35] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E5B842] to-[#C99E30] border border-[#F0C450] flex items-center justify-center font-black text-[#0B0D10] text-xl shadow-brutal-sm">
            ⚡
          </div>
          <h1 className="font-black text-xl tracking-tight text-[#F0F3F8]">ENPASSANT</h1>
        </div>

        <Link href="/dashboard">
          <BrutalistButton variant="primary">
            Launch Training App →
          </BrutalistButton>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8 py-16">
        <span className="text-xs uppercase tracking-widest px-3.5 py-1 font-mono font-bold bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/30">
          Adaptive Browser-First Chess Coach
        </span>

        <h2 className="text-4xl md:text-6xl font-black text-[#F0F3F8] leading-tight tracking-tight uppercase">
          Learn your openings.<br />
          Play your games.<br />
          <span className="text-[#E5B842]">Train your mistakes.</span>
        </h2>

        <p className="text-sm md:text-base text-[#94A0B8] max-w-2xl leading-relaxed">
          EnPassant connects Stockfish 18 MultiPV analysis, automated game loading from Chess.com & Lichess, positional explanations, and spaced repetition into a continuous learning loop.
        </p>

        <div className="flex items-center gap-4 pt-4">
          <Link href="/dashboard">
            <BrutalistButton variant="primary" className="px-8 py-3.5 text-sm">
              Start Free Training
            </BrutalistButton>
          </Link>
          <Link href="/openings">
            <BrutalistButton variant="outline" className="px-8 py-3.5 text-sm">
              Explore Library
            </BrutalistButton>
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-[#64748B] border-t border-[#242A35] pt-6 max-w-7xl mx-auto w-full font-mono">
        EnPassant — Privacy-conscious, browser-first chess opening coach. Powered by Stockfish 18 WASM.
      </footer>
    </div>
  );
}
