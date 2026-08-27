'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { EcoSearchEngine } from '@/openings/eco/search';
import { EcoOpeningRecord } from '@/openings/eco/types';
import { CourseGenerator } from '@/openings/courses/courseGenerator';
import { Search, BookOpen, Target, Sparkles, ChevronRight, Award } from 'lucide-react';

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
    <div className="flex min-h-screen bg-[#0E0F11]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#2A2E35] pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F2F4F7]">Comprehensive ECO Opening Search</h1>
            <p className="text-xs text-[#8A919C] mt-1">
              Search any opening (A00–E99), variation, or starting move to dynamically generate a structured course.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8A919C] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search French, King's Indian, B12, 1.e4..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#15171B] border border-[#2A2E35] text-xs text-[#F2F4F7] focus:outline-none focus:border-[#D6B15E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Search Results List */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A919C] mb-1">
              ECO Records Found ({searchResults.length})
            </h3>
            {searchResults.map(record => (
              <div
                key={record.eco + record.name}
                onClick={() => setSelectedOpening(record)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  selectedOpening?.eco === record.eco && selectedOpening?.name === record.name
                    ? 'bg-[#1C1F24] border-[#D6B15E]'
                    : 'bg-[#15171B] border-[#2A2E35] hover:border-[#D6B15E]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0E0F11] text-[#D6B15E] border border-[#2A2E35]">
                    {record.eco} • {record.category}
                  </span>
                  <span className="text-xs text-[#8A919C] font-mono">{record.moves.join(' ')}</span>
                </div>
                <h4 className="font-bold text-sm text-[#F2F4F7]">{record.name}</h4>
              </div>
            ))}
          </div>

          {/* Right Column: Dynamic Course Generator Overview */}
          <div className="lg:col-span-7">
            {generatedCourse ? (
              <div className="p-6 rounded-2xl bg-[#15171B] border border-[#2A2E35] flex flex-col gap-6 text-[#F2F4F7]">
                <div className="flex flex-col gap-2 border-b border-[#2A2E35] pb-4">
                  <div className="flex items-center gap-2 text-[#D6B15E]">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Dynamically Generated Opening Course
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#F2F4F7]">{generatedCourse.title}</h2>
                  <p className="text-xs text-[#8A919C] leading-relaxed">{generatedCourse.description}</p>
                </div>

                {/* Modules Overview */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A919C]">
                    Curriculum Modules ({generatedCourse.modules.length})
                  </h3>
                  {generatedCourse.modules.map(mod => (
                    <div
                      key={mod.id}
                      className="p-4 rounded-xl bg-[#1C1F24] border border-[#2A2E35] flex flex-col gap-2"
                    >
                      <h4 className="font-bold text-sm text-[#F2F4F7]">{mod.title}</h4>
                      <p className="text-xs text-[#8A919C]">{mod.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-[#D6B15E]">
                          {mod.positions.length} Interactive Lessons
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#2A2E35] flex items-center justify-between">
                  <span className="text-xs text-[#4CAF7D] font-semibold flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Adaptive for {generatedCourse.targetRatingLevel} Level
                  </span>

                  <Link
                    href={`/train?eco=${generatedCourse.eco}`}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D6B15E] hover:bg-[#b89547] text-black font-extrabold text-xs shadow-lg transition-all"
                  >
                    <Target className="w-4 h-4" />
                    Start Course Training
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#8A919C] border border-dashed border-[#2A2E35] rounded-xl">
                Select an opening from the left list to view generated course details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
