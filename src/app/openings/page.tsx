'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { EcoSearchEngine } from '@/openings/eco/search';
import { EcoOpeningRecord } from '@/openings/eco/types';
import { CourseGenerator } from '@/openings/courses/courseGenerator';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { Search } from 'lucide-react';

export default function OpeningsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EcoOpeningRecord[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<EcoOpeningRecord | null>(null);

  useEffect(() => {
    const results = EcoSearchEngine.search(searchQuery);
    setSearchResults(results.map(r => r.record));
    if (results.length > 0 && !selectedOpening) {
      setSelectedOpening(results[0].record);
    }
  }, [searchQuery]);

  const generatedCourse = selectedOpening
    ? CourseGenerator.generateCourseForOpening(selectedOpening, 1500)
    : null;

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              OPENING CATALOGUE
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              ECO CLASSIFICATION INDEX A00 — E99
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="SEARCH FRENCH, CARO, B12, 1.E4..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#12151B] border-2 border-[#242A35] text-xs font-bold uppercase tracking-wider text-[#F0F3F8] shadow-brutal-sm focus:outline-none focus:border-[#E5B842]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Search Results List */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-2">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#94A0B8] mb-1">
              ECO RECORDS FOUND ({searchResults.length})
            </h3>
            {searchResults.map(record => (
              <div
                key={record.eco + record.name}
                onClick={() => setSelectedOpening(record)}
                className={`p-4 border-2 cursor-pointer flex flex-col gap-2 transition-all ${
                  selectedOpening?.eco === record.eco && selectedOpening?.name === record.name
                    ? 'bg-[#181C24] text-[#F0F3F8] border-[#E5B842] shadow-brutal translate-x-1'
                    : 'bg-[#12151B] text-[#94A0B8] border-[#242A35] shadow-brutal-sm hover:border-[#E5B842]/50 hover:text-[#F0F3F8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <BrutalistBadge variant="orange">{record.eco}</BrutalistBadge>
                  <span className="font-mono text-xs font-bold text-[#94A0B8]">{record.moves.join(' ')}</span>
                </div>
                <h4 className="font-extrabold text-sm uppercase tracking-tight text-[#F0F3F8]">{record.name}</h4>
              </div>
            ))}
          </div>

          {/* Right Column: Dynamic Course Generator Overview */}
          <div className="lg:col-span-7">
            {generatedCourse ? (
              <BrutalistCard className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 border-b border-[#242A35] pb-4">
                  <div className="flex items-center gap-2">
                    <BrutalistBadge variant="orange">GENERATED COURSE</BrutalistBadge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase text-[#F0F3F8]">
                    {generatedCourse.title}
                  </h2>
                  <p className="text-xs font-medium text-[#94A0B8] leading-relaxed">
                    {generatedCourse.description}
                  </p>
                </div>

                {/* Modules Overview */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#94A0B8]">
                    CURRICULUM MODULES ({generatedCourse.modules.length})
                  </h3>
                  {generatedCourse.modules.map(mod => (
                    <div
                      key={mod.id}
                      className="p-4 bg-[#181C24] border border-[#242A35] shadow-brutal-sm flex flex-col gap-2"
                    >
                      <h4 className="font-bold text-sm uppercase text-[#F0F3F8]">{mod.title}</h4>
                      <p className="text-xs font-medium text-[#94A0B8]">{mod.description}</p>
                      <span className="font-mono text-[10px] font-bold text-[#E5B842] uppercase">
                        {mod.positions.length} INTERACTIVE LESSONS
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#242A35] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#10B981] uppercase">
                    LEVEL: {generatedCourse.targetRatingLevel}
                  </span>

                  <Link href={`/train?eco=${generatedCourse.eco}`}>
                    <BrutalistButton variant="primary">
                      START COURSE TRAINING →
                    </BrutalistButton>
                  </Link>
                </div>
              </BrutalistCard>
            ) : (
              <div className="p-12 text-center text-xs font-semibold text-[#94A0B8] border-2 border-dashed border-[#242A35] bg-[#12151B]">
                SELECT AN OPENING RECORD FROM THE INDEX TO VIEW GENERATED CURRICULUM.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
