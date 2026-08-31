'use client';

import React from 'react';
import { OpeningProgressRecord } from '../../storage/indexedDB';
import { ELO_TIERS, PhaseAdjustedLevel } from '../../engine/eloLevels';
import {
  BOOK_DEPTH_TARGET,
  bookDepthRemaining,
  EloOffer,
  isCalibrated,
  isReadyForCalibration,
  LESSON_TARGET,
  lessonsRemaining,
} from '../../training/masteryStore';
import { describePhase } from '../../engine/opponentEngine';
import { BrutalistCard } from '../ui/BrutalistCard';
import { BrutalistBadge } from '../ui/BrutalistBadge';
import { BrutalistButton } from '../ui/BrutalistButton';
import { GraduationCap, Gauge, TrendingUp, Check, X } from 'lucide-react';

interface OpponentControlPanelProps {
  progress: OpeningProgressRecord | null;
  /** The level in force for the position on the board right now. */
  activeLevel: PhaseAdjustedLevel | null;
  offer: EloOffer | null;
  onSetElo: (elo: number) => void;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
}

export const OpponentControlPanel: React.FC<OpponentControlPanelProps> = ({
  progress,
  activeLevel,
  offer,
  onSetElo,
  onAcceptOffer,
  onDeclineOffer,
}) => {
  if (!progress) return null;

  const calibrated = isCalibrated(progress);
  const readyToCalibrate = isReadyForCalibration(progress);
  const lessonsLeft = lessonsRemaining(progress);
  const depthLeft = bookDepthRemaining(progress);

  const lessonPct = Math.min(100, (progress.lessonsCompleted / LESSON_TARGET) * 100);
  const depthPct = Math.min(100, (progress.bookDepthReached / BOOK_DEPTH_TARGET) * 100);

  return (
    <BrutalistCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#242A35] pb-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#E5B842]" />
          <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-[#F0F3F8]">
            OPPONENT RATING
          </h4>
        </div>
        {calibrated ? (
          <BrutalistBadge variant="orange">{progress.botElo} ELO</BrutalistBadge>
        ) : (
          <BrutalistBadge variant="dark">UNRATED</BrutalistBadge>
        )}
      </div>

      {/* Promotion / demotion offer — the opponent never changes strength unprompted */}
      {offer && (
        <div className="p-3 bg-[#E5B842]/10 border border-[#E5B842]/40 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp
              className={`w-4 h-4 text-[#E5B842] ${offer.direction === 'DOWN' ? 'rotate-180' : ''}`}
            />
            <span className="font-extrabold text-[11px] uppercase tracking-widest text-[#E5B842]">
              {offer.direction === 'UP' ? 'LEVEL UP?' : 'EASE OFF?'}
            </span>
          </div>
          <p className="text-[11px] text-[#F0F3F8] leading-relaxed">{offer.reason}</p>
          <div className="flex items-center gap-2">
            <BrutalistButton variant="primary" onClick={onAcceptOffer} className="text-[10px] py-1.5 px-3">
              <Check className="w-3 h-3 inline mr-1" />
              MOVE TO {offer.toElo}
            </BrutalistButton>
            <BrutalistButton variant="outline" onClick={onDeclineOffer} className="text-[10px] py-1.5 px-3">
              <X className="w-3 h-3 inline mr-1" />
              STAY
            </BrutalistButton>
          </div>
        </div>
      )}

      {/* Lesson phase, before a rating exists */}
      {!calibrated && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-[#E5B842] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#94A0B8] leading-relaxed">
              {readyToCalibrate
                ? 'Lessons complete. Your first full game sets the opponent’s rating.'
                : `Learn the line first — ${LESSON_TARGET} drilled moves and ${BOOK_DEPTH_TARGET} plies of theory. The rating is set after that, so it measures your play rather than unfamiliarity.`}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="font-bold text-[#94A0B8]">LESSONS</span>
              <span className="font-black text-[#F0F3F8]">
                {progress.lessonsCompleted} / {LESSON_TARGET}
              </span>
            </div>
            <div className="h-2 w-full bg-[#0B0D10] border border-[#242A35]">
              <div
                className="h-full bg-gradient-to-r from-[#C99E30] to-[#E5B842] transition-all duration-500"
                style={{ width: `${lessonPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="font-bold text-[#94A0B8]">BOOK DEPTH</span>
              <span className="font-black text-[#F0F3F8]">
                {progress.bookDepthReached} / {BOOK_DEPTH_TARGET} PLIES
              </span>
            </div>
            <div className="h-2 w-full bg-[#0B0D10] border border-[#242A35]">
              <div
                className="h-full bg-gradient-to-r from-[#0E9F6E] to-[#10B981] transition-all duration-500"
                style={{ width: `${depthPct}%` }}
              />
            </div>
          </div>

          {!readyToCalibrate && (
            <p className="font-mono text-[10px] font-bold text-[#E5B842]">
              {lessonsLeft > 0 && `${lessonsLeft} MOVES TO GO`}
              {lessonsLeft > 0 && depthLeft > 0 && ' · '}
              {depthLeft > 0 && `${depthLeft} MORE PLIES OF THEORY`}
            </p>
          )}
        </div>
      )}

      {/* Live strength for the position on the board */}
      {activeLevel && (
        <div className="flex flex-col gap-1 pt-1 font-mono text-[10px]">
          <div className="flex justify-between">
            <span className="font-bold text-[#94A0B8]">PHASE:</span>
            <span className="font-black text-[#F0F3F8]">{describePhase(activeLevel.phase)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-[#94A0B8]">PLAYING AT:</span>
            <span className="font-black text-[#E5B842]">
              {activeLevel.effectiveElo} ELO
              {activeLevel.effectiveElo !== activeLevel.baseElo && (
                <span className="text-[#10B981]">
                  {' '}
                  (+{activeLevel.effectiveElo - activeLevel.baseElo})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-[#94A0B8]">SKILL / DEPTH:</span>
            <span className="font-black text-[#F0F3F8]">
              {activeLevel.skill} / {activeLevel.depth}
            </span>
          </div>
        </div>
      )}

      {/* Manual override, always available */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-[#242A35]">
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A0B8]">
          SET OPPONENT ELO
        </label>
        <select
          value={progress.botElo ?? ''}
          onChange={event => onSetElo(Number(event.target.value))}
          className="px-3 py-2 bg-[#181C24] border border-[#242A35] text-[#F0F3F8] font-mono text-[11px] focus:outline-none focus:border-[#E5B842] cursor-pointer"
        >
          {!calibrated && <option value="">Auto (after lessons)</option>}
          {ELO_TIERS.map(tier => (
            <option key={tier} value={tier}>
              {tier} Elo
            </option>
          ))}
        </select>
        {progress.gamesPlayed > 0 && (
          <p className="font-mono text-[10px] text-[#94A0B8]">
            {progress.gamesPlayed} GAME{progress.gamesPlayed === 1 ? '' : 'S'} PLAYED
            {progress.winsAtCurrentElo > 0 && ` · ${progress.winsAtCurrentElo}W STREAK`}
          </p>
        )}
      </div>
    </BrutalistCard>
  );
};
