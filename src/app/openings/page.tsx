'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { OPENINGS_DATABASE } from '@/openings/database';
import { OpeningCard } from '@/components/openings/OpeningCard';
import { BookOpen, Search, Filter } from 'lucide-react';

export default function OpeningsPage() {
  const [filterSide, setFilterSide] = useState<'all' | 'white' | 'black'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpenings = OPENINGS_DATABASE.filter(opening => {
    const matchesSide = filterSide === 'all' || opening.side === filterSide;
    const matchesSearch = opening.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opening.eco.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSide && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#2A2E35] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F2F4F7]">Opening Library</h1>
            <p className="text-xs text-[#8A919C] mt-1">
              Master core opening theory, key strategic pawn breaks, and engine-recommended move trees.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#8A919C] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search opening or ECO..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#15171B] border border-[#2A2E35] text-xs text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
              />
            </div>

            <div className="flex items-center bg-[#15171B] border border-[#2A2E35] rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterSide('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterSide === 'all' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSide('white')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterSide === 'white' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setFilterSide('black')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterSide === 'black' ? 'bg-[#1C1F24] text-[#D6B15E]' : 'text-[#8A919C]'
                }`}
              >
                Black
              </button>
            </div>
          </div>
        </div>

        {/* Openings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpenings.map(opening => (
            <OpeningCard key={opening.id} opening={opening} />
          ))}
        </div>
      </main>
    </div>
  );
}
