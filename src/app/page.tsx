'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0E0F11] flex flex-col justify-between p-8 text-[#F2F4F7]">
      <header className="flex items-center justify-between max-w-7xl mx-auto w-full border-b border-[#2A2E35] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D6B15E] to-[#B38E3F] flex items-center justify-center font-bold text-black text-xl shadow-lg">
            ⚡
          </div>
          <h1 className="font-extrabold text-xl tracking-wider text-[#F2F4F7]">EnPassant</h1>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-bold text-xs shadow-lg transition-all"
        >
          Launch Training App
        </Link>
      </header>

      <main className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8 py-16">
        <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-[#D6B15E]/10 text-[#D6B15E] border border-[#D6B15E]/30 font-bold">
          Adaptive Browser-First Chess Coach
        </span>

        <h2 className="text-4xl md:text-6xl font-extrabold text-[#F2F4F7] leading-tight">
          Learn your openings.<br />
          Play your games.<br />
          <span className="text-[#D6B15E]">Train your mistakes.</span>
        </h2>

        <p className="text-base text-[#8A919C] max-w-2xl leading-relaxed">
          EnPassant connects Stockfish MultiPV analysis, automated game loading from Chess.com & Lichess, positional explanations, and spaced repetition into a continuous learning loop.
        </p>

        <div className="flex items-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-[#D6B15E] text-black font-extrabold text-sm hover:scale-105 transition-all shadow-xl"
          >
            Start Free Training
          </Link>
          <Link
            href="/openings"
            className="px-8 py-3.5 rounded-xl bg-[#15171B] border border-[#2A2E35] text-[#F2F4F7] font-extrabold text-sm hover:bg-[#1C1F24] transition-all"
          >
            Explore Library
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-[#8A919C] border-t border-[#2A2E35] pt-6 max-w-7xl mx-auto w-full">
        EnPassant — Privacy-conscious, browser-first chess opening coach. Powered by Stockfish WASM.
      </footer>

    </div>
  );
}
