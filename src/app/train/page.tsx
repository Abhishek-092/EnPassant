'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess, Move } from 'chess.js';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { CoachPanel } from '@/components/chess/CoachPanel';
import { OpponentControlPanel } from '@/components/training/OpponentControlPanel';
import { stockfishEngine } from '@/engine/stockfishWorker';
import { analysisQueue } from '@/analysis/analysisQueue';
import { MultiPvCandidate } from '@/chess/transpositionResolver';
import { bestCandidateForSideToMove } from '@/engine/evaluationUtils';
import { getBookReply, selectOpponentMove } from '@/engine/opponentEngine';
import { engineLevelForPosition, MIN_ELO, PhaseAdjustedLevel } from '@/engine/eloLevels';
import { buildMoveReview, MoveReview } from '@/training/moveReview';
import {
  applyCalibration,
  EloOffer,
  GameOutcome,
  gradeFromClassification,
  isCalibrated,
  isReadyForCalibration,
  loadMastery,
  recordAttempt,
  recordGameResult,
  setBotElo,
} from '@/training/masteryStore';
import {
  listTrainingOpenings,
  resolveTrainingOpening,
  TrainingOpening,
} from '@/openings/openingResolver';
import { OpeningProgressRecord } from '@/storage/indexedDB';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { RefreshCw, Target, TrendingUp, BookOpen } from 'lucide-react';

function TrainWorkspace() {
  const searchParams = useSearchParams();

  const [opening, setOpening] = useState<TrainingOpening>(() =>
    resolveTrainingOpening({
      openingId: searchParams.get('openingId'),
      eco: searchParams.get('eco'),
    })
  );

  // Move list is the source of truth; the board is derived by replaying it. This keeps history,
  // undo and reset trivial, and avoids the desync that comes from mutating a shared Chess object.
  const [moves, setMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [candidates, setCandidates] = useState<MultiPvCandidate[]>([]);
  const [analyzedFen, setAnalyzedFen] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [mateScore, setMateScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [moveReview, setMoveReview] = useState<MoveReview | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [hintUsedForFen, setHintUsedForFen] = useState<string | null>(null);
  const [progress, setProgress] = useState<OpeningProgressRecord | null>(null);
  const [eloOffer, setEloOffer] = useState<EloOffer | null>(null);
  const [engineStatusText, setEngineStatusText] = useState('INITIALIZING ENGINE...');
  const [isEngineVerified, setIsEngineVerified] = useState(false);

  const openingRef = useRef(opening);
  openingRef.current = opening;

  // Mastery is written from async callbacks, so the latest record is tracked in a ref rather
  // than read inside a state updater (updaters are re-invoked in StrictMode and would
  // double-count every drilled move).
  const progressRef = useRef<OpeningProgressRecord | null>(null);

  /**
   * Incremented on every reset and opening switch. Async work captures the value it started
   * under and abandons itself if the generation has moved on. Crucially, the "opponent is
   * thinking" flag is cleared from a `finally` that runs even when the work is abandoned —
   * leaving it set is what previously froze the board after New Game.
   */
  const generationRef = useRef(0);
  const opponentMovedFromRef = useRef<string | null>(null);
  const resultRecordedRef = useRef(false);
  /** Latest position on the board, so a search that resolves late cannot overwrite the bar. */
  const fenRef = useRef('');

  const game = useMemo(() => {
    const chess = new Chess();
    for (const san of moves) {
      try {
        chess.move(san);
      } catch {
        break;
      }
    }
    return chess;
  }, [moves]);

  const fen = game.fen();
  fenRef.current = fen;
  const history = useMemo(() => game.history(), [game]);
  const isGameOver = game.isGameOver();

  const userTurn = opening.userColor === 'white' ? 'w' : 'b';
  const isUserTurn = game.turn() === userTurn;

  const botElo = progress?.botElo ?? MIN_ELO;
  const activeLevel: PhaseAdjustedLevel | null = useMemo(
    () => (progress ? engineLevelForPosition(botElo, fen) : null),
    [progress, botElo, fen]
  );

  const bookReply = useMemo(
    () => getBookReply(opening.bookMoves, history),
    [opening.bookMoves, history]
  );

  const applyEvaluationFrom = useCallback((positionFen: string, cands: MultiPvCandidate[]) => {
    const best = bestCandidateForSideToMove(cands, positionFen);
    if (!best) return;
    setEvaluation(best.evaluation);
    setMateScore(best.mateScore ?? null);
  }, []);

  /** Streamed partial evaluations arrive in White's perspective already. */
  const applyProgressEvaluation = useCallback(
    (partial: { evaluationCp: number; mateScore: number | null }) => {
      setMateScore(partial.mateScore);
      setEvaluation(partial.mateScore !== null ? null : partial.evaluationCp);
    },
    []
  );

  const resetBoardState = useCallback(() => {
    generationRef.current += 1;
    opponentMovedFromRef.current = null;
    resultRecordedRef.current = false;

    stockfishEngine.cancelActiveAnalysis();

    setMoves([]);
    setLastMove(null);
    setCandidates([]);
    setAnalyzedFen(null);
    setEvaluation(null);
    setMateScore(null);
    setMoveReview(null);
    setHintMessage(null);
    setHintUsedForFen(null);
    setEloOffer(null);
    // Always clear the in-flight flags, or the board stays locked after a reset.
    setIsAnalyzing(false);
    setIsOpponentThinking(false);
  }, []);

  // --- Opening selection from URL ---
  useEffect(() => {
    const resolved = resolveTrainingOpening({
      openingId: searchParams.get('openingId'),
      eco: searchParams.get('eco'),
    });
    setOpening(current => (current.id === resolved.id ? current : resolved));
  }, [searchParams]);

  // Background game analysis shares the one engine worker. Hold it while training so the
  // opponent stays responsive, and release it on the way out.
  useEffect(() => {
    analysisQueue.pause();
    return () => analysisQueue.resume();
  }, []);

  // --- Mastery record for the active opening ---
  useEffect(() => {
    let cancelled = false;
    const seed = {
      openingId: opening.id,
      eco: opening.eco,
      name: opening.name,
      variationName: opening.variationName,
      userColor: opening.userColor,
    };

    loadMastery(seed).then(record => {
      if (cancelled) return;
      progressRef.current = record;
      setProgress(record);
    });

    return () => {
      cancelled = true;
    };
  }, [opening]);

  // --- Game result, recorded once per finished game ---
  useEffect(() => {
    if (!isGameOver || resultRecordedRef.current) return;
    const record = progressRef.current;
    if (!record || !isCalibrated(record)) return;

    resultRecordedRef.current = true;

    let outcome: GameOutcome = 'DRAW';
    if (game.isCheckmate()) {
      // Checkmate: whoever is to move has been mated.
      outcome = game.turn() === userTurn ? 'LOSS' : 'WIN';
    }

    recordGameResult(record, outcome).then(({ record: updated, offer }) => {
      progressRef.current = updated;
      setProgress(updated);
      setEloOffer(offer);
    });
  }, [isGameOver, game, userTurn]);

  /**
   * One search per position. On the user's turn it feeds the evaluation bar and the candidate
   * list they are about to be graded against; on the opponent's turn the opponent's own search
   * feeds the bar, so the evaluation updates after every move without analyzing twice.
   */
  useEffect(() => {
    if (isGameOver) {
      // A search may have been in flight when the game ended; clear the in-flight flags so the
      // board and evaluation bar settle instead of pulsing indefinitely.
      setIsAnalyzing(false);
      setIsOpponentThinking(false);
      return;
    }

    const generation = generationRef.current;
    const isCurrent = () => generationRef.current === generation;
    /** Evaluation writes must also still be about the position on the board. */
    const isCurrentPosition = () => isCurrent() && fenRef.current === fen;

    const refreshEngineStatus = () => {
      const status = stockfishEngine.getStatus();
      setEngineStatusText(status.statusText.toUpperCase());
      setIsEngineVerified(status.available);
    };

    if (isUserTurn) {
      setIsAnalyzing(true);
      stockfishEngine
        .analyzePosition(fen, {
          multiPv: 3,
          profile: 'TRAINING',
          onProgress: partial => {
            if (isCurrentPosition()) applyProgressEvaluation(partial);
          },
        })
        .then(result => {
          if (!isCurrent()) return;
          // Candidates are keyed by the position they describe, so they are still useful for
          // grading a move that has already been played.
          setCandidates(result);
          setAnalyzedFen(fen);
          if (isCurrentPosition()) applyEvaluationFrom(fen, result);
          refreshEngineStatus();
        })
        .finally(() => {
          // Runs even when abandoned, so the board never stays locked.
          if (isCurrentPosition()) setIsAnalyzing(false);
        });

      return;
    }

    // --- Opponent's turn ---
    if (opponentMovedFromRef.current === fen) return;
    opponentMovedFromRef.current = fen;

    setIsOpponentThinking(true);

    const playOpponentMove = async () => {
      const activeBook = getBookReply(openingRef.current.bookMoves, history);

      let chosenSan: string | null = null;
      let chosenUci: string | null = null;

      if (activeBook) {
        // Still in theory: play the book move immediately and evaluate in the background, so
        // theory moves appear instantly rather than waiting on a search.
        chosenSan = activeBook;
        void stockfishEngine
          .analyzePosition(fen, { multiPv: 1, profile: 'FAST' })
          .then(result => {
            if (isCurrentPosition()) applyEvaluationFrom(fen, result);
          });
      } else {
        const pick = await selectOpponentMove(fen, botElo, p => {
          if (isCurrentPosition()) applyProgressEvaluation(p);
        });
        if (!isCurrent() || !pick) return;
        chosenSan = pick.san;
        chosenUci = pick.uci;
        if (isCurrentPosition()) applyEvaluationFrom(fen, pick.candidates);
      }

      refreshEngineStatus();
      if (!isCurrent() || !chosenSan) return;

      // Resolve the chosen move against the board: SAN first, UCI as a fallback for the case
      // where the engine's SAN conversion did not survive.
      const probe = new Chess(fen);
      let played: Move | null = null;
      try {
        played = probe.move(chosenSan);
      } catch {
        played = null;
      }
      if (!played && chosenUci) {
        try {
          played = probe.move({
            from: chosenUci.slice(0, 2),
            to: chosenUci.slice(2, 4),
            promotion: chosenUci.length > 4 ? chosenUci[4] : undefined,
          });
        } catch {
          played = null;
        }
      }
      if (!played) return;
      const opponentMove = played;

      setLastMove({ from: opponentMove.from, to: opponentMove.to });
      setMoves(previous => [...previous, opponentMove.san]);
    };

    playOpponentMove().finally(() => {
      if (isCurrent()) setIsOpponentThinking(false);
    });
  }, [
    fen,
    isUserTurn,
    isGameOver,
    botElo,
    history,
    applyEvaluationFrom,
    applyProgressEvaluation,
  ]);

  /** Grades the move just played and records it against opening mastery. */
  const reviewUserMove = useCallback(
    async (
      playedSan: string,
      playedUci: string,
      fenBefore: string,
      expectedBook: string | null,
      plyIndex: number
    ) => {
      // Prefer the candidates already computed for this position; otherwise fetch them, so a
      // fast mover never loses their feedback.
      let reviewCandidates = analyzedFen === fenBefore ? candidates : [];
      if (reviewCandidates.length === 0) {
        reviewCandidates = await stockfishEngine.analyzePosition(fenBefore, {
          multiPv: 3,
          profile: 'TRAINING',
        });
      }

      const review = buildMoveReview({
        playedSan,
        playedUci,
        fenBefore,
        candidates: reviewCandidates,
        bookSan: expectedBook,
        openingName: openingRef.current.variationName
          ? `${openingRef.current.name}: ${openingRef.current.variationName}`
          : openingRef.current.name,
      });
      setMoveReview(review);

      const usedHint = hintUsedForFen === fenBefore;
      const grade = review.followedBook ? 5 : gradeFromClassification(review.category, usedHint);

      const current = progressRef.current;
      if (!current) return;

      let updated = await recordAttempt(current, {
        grade,
        fenBefore,
        usedHint,
        wasBookMove: review.followedBook,
        plyIndex,
      });

      // Establish the opponent's rating the moment the lesson phase is cleared.
      if (!isCalibrated(updated) && isReadyForCalibration(updated)) {
        updated = await applyCalibration(updated);
      }

      progressRef.current = updated;
      setProgress(updated);
    },
    [analyzedFen, candidates, hintUsedForFen]
  );

  const handleMove = useCallback(
    (source: string, target: string): boolean => {
      if (!isUserTurn || isOpponentThinking || isGameOver) return false;

      const probe = new Chess(fen);
      let played: Move | null = null;
      try {
        played = probe.move({
          from: source,
          to: target.slice(0, 2),
          promotion: target.length > 2 ? target[2] : 'q',
        });
      } catch {
        return false;
      }
      if (!played) return false;
      const userMove = played;

      const fenBefore = fen;
      const expectedBook = bookReply;
      const plyIndex = history.length;

      setLastMove({ from: userMove.from, to: userMove.to });
      setMoves(previous => [...previous, userMove.san]);
      setHintMessage(null);

      const playedUci = `${userMove.from}${userMove.to}${userMove.promotion ?? ''}`;
      void reviewUserMove(userMove.san, playedUci, fenBefore, expectedBook, plyIndex);
      return true;
    },
    [fen, isUserTurn, isOpponentThinking, isGameOver, bookReply, history.length, reviewUserMove]
  );

  const handleShowHint = useCallback(() => {
    setHintUsedForFen(fen);

    if (bookReply) {
      setHintMessage(
        `Theory continues with ${bookReply}. ${opening.keyPlans[0] ?? 'Follow the main plan of the opening.'}`
      );
      return;
    }

    const best = bestCandidateForSideToMove(candidates, fen);
    if (best) {
      setHintMessage(
        `Stockfish is looking at ${best.move.toUpperCase()}${
          opening.pawnBreaks.length > 0
            ? ` — keep the ${opening.pawnBreaks.join('/')} break in mind.`
            : '.'
        }`
      );
    } else {
      setHintMessage('Stockfish is still evaluating candidate moves...');
    }
  }, [bookReply, candidates, fen, opening]);

  const switchOpening = useCallback(
    (openingId: string) => {
      setOpening(resolveTrainingOpening({ openingId }));
      resetBoardState();
    },
    [resetBoardState]
  );

  const handleSetElo = useCallback(async (elo: number) => {
    const current = progressRef.current;
    if (!current || !elo) return;
    const updated = await setBotElo(current, elo, true);
    progressRef.current = updated;
    setProgress(updated);
    setEloOffer(null);
  }, []);

  const handleAcceptOffer = useCallback(async () => {
    const current = progressRef.current;
    if (!current || !eloOffer) return;
    // Accepting a suggested change is not a manual override, so future offers keep coming.
    const updated = await setBotElo(current, eloOffer.toElo, false);
    progressRef.current = updated;
    setProgress(updated);
    setEloOffer(null);
  }, [eloOffer]);

  const masteryPct = progress ? Math.round(progress.mastery) : 0;
  const accuracy =
    progress && progress.attempts > 0
      ? Math.round((progress.correct / progress.attempts) * 100)
      : null;

  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#242A35] pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-[#F0F3F8]">
              TRAINING LABORATORY
            </h1>
            <p className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider mt-1">
              YOU PLAY {opening.userColor.toUpperCase()} ·{' '}
              {progress && isCalibrated(progress)
                ? `OPPONENT RATED ${progress.botElo}`
                : 'LESSON PHASE — RATING NOT SET'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={opening.id}
              onChange={event => switchOpening(event.target.value)}
              className="px-3.5 py-2.5 bg-[#12151B] border-2 border-[#242A35] text-xs font-bold uppercase tracking-wider text-[#F0F3F8] shadow-brutal-sm focus:outline-none focus:border-[#E5B842] cursor-pointer"
            >
              {listTrainingOpenings().map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.userColor === 'white' ? 'W' : 'B'})
                </option>
              ))}
            </select>

            <BrutalistButton variant="outline" onClick={resetBoardState}>
              <RefreshCw className="w-4 h-4 inline mr-1" /> NEW GAME
            </BrutalistButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Opening context, opponent rating, move list */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <BrutalistCard>
              <div className="flex flex-col gap-2 border-b border-[#242A35] pb-3">
                <div className="flex items-center justify-between">
                  <BrutalistBadge variant="orange">ECO {opening.eco}</BrutalistBadge>
                  <BrutalistBadge variant="dark">
                    YOU: {opening.userColor.toUpperCase()}
                  </BrutalistBadge>
                </div>
                <h3 className="font-black text-lg uppercase text-[#F0F3F8]">{opening.name}</h3>
                {opening.variationName && (
                  <p className="text-xs font-semibold text-[#94A0B8]">{opening.variationName}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[#94A0B8] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#E5B842]" /> LINE MASTERY
                  </span>
                  <span className="font-black text-[#E5B842]">{masteryPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-[#0B0D10] border border-[#242A35]">
                  <div
                    className="h-full bg-gradient-to-r from-[#C99E30] to-[#E5B842] transition-all duration-500"
                    style={{ width: `${masteryPct}%` }}
                  />
                </div>

                <div className="flex flex-col gap-1 pt-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#94A0B8]">DRILLED MOVES:</span>
                    <span className="font-black text-[#F0F3F8]">{progress?.attempts ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#94A0B8]">ACCURACY:</span>
                    <span className="font-black text-[#F0F3F8]">
                      {accuracy === null ? '—' : `${accuracy}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#94A0B8]">STREAK:</span>
                    <span className="font-black text-[#10B981]">
                      {progress?.correctStreak ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </BrutalistCard>

            <OpponentControlPanel
              progress={progress}
              activeLevel={activeLevel}
              offer={eloOffer}
              onSetElo={handleSetElo}
              onAcceptOffer={handleAcceptOffer}
              onDeclineOffer={() => setEloOffer(null)}
            />

            {history.length > 0 && (
              <BrutalistCard className="flex flex-col gap-2">
                <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-[#94A0B8] border-b border-[#242A35] pb-2">
                  MOVES
                </h4>
                <div className="font-mono text-[11px] text-[#94A0B8] leading-relaxed max-h-40 overflow-y-auto">
                  {history.map((san, index) =>
                    index % 2 === 0 ? (
                      <span key={index} className="mr-2">
                        <span className="text-[#64748B]">{index / 2 + 1}.</span>{' '}
                        <span className="text-[#F0F3F8] font-bold">{san}</span>
                      </span>
                    ) : (
                      <span key={index} className="mr-3 text-[#F0F3F8] font-bold">
                        {san}
                      </span>
                    )
                  )}
                </div>
              </BrutalistCard>
            )}
          </div>

          {/* Center Column: Board with evaluation bar */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <ChessBoardWrapper
              fen={fen}
              onMove={handleMove}
              lastMove={lastMove}
              orientation={opening.userColor}
              evaluation={evaluation}
              mateScore={mateScore}
              isAnalyzing={isAnalyzing || isOpponentThinking}
              isInteractive={isUserTurn && !isOpponentThinking && !isGameOver}
            />

            {bookReply && (
              <div className="w-full max-w-[580px] px-3 py-2 bg-[#E5B842]/10 border border-[#E5B842]/30 font-mono text-[11px] font-bold text-[#E5B842] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                IN THEORY — {opening.variationName || opening.name}, move {history.length + 1}
              </div>
            )}
          </div>

          {/* Right Column: Coach */}
          <div className="lg:col-span-4">
            <CoachPanel
              engineStatusText={engineStatusText}
              isEngineVerified={isEngineVerified}
              candidates={candidates}
              classification={null}
              explanation={null}
              moveReview={moveReview}
              opponent={
                activeLevel
                  ? {
                      label: `${activeLevel.effectiveElo} ELO`,
                      description: `Skill ${activeLevel.skill} · depth ${activeLevel.depth}`,
                      isThinking: isOpponentThinking,
                    }
                  : null
              }
              onShowHint={handleShowHint}
              hintMessage={hintMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function TrainFallback() {
  return (
    <div className="flex min-h-screen bg-[#0B0D10] text-[#F0F3F8]">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-[#E5B842]">
          <Target className="w-5 h-5 animate-pulse" />
          LOADING TRAINING LABORATORY...
        </div>
      </main>
    </div>
  );
}

export default function TrainPage() {
  return (
    <Suspense fallback={<TrainFallback />}>
      <TrainWorkspace />
    </Suspense>
  );
}
