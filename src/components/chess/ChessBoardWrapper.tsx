'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { EvaluationBar } from './EvaluationBar';

interface ChessBoardWrapperProps {
  fen: string;
  onMove?: (sourceSquare: string, targetSquare: string) => boolean;
  orientation?: 'white' | 'black';
  showArrows?: boolean;
  customArrows?: Array<{ startSquare: string; endSquare: string; color: string }>;
  isInteractive?: boolean;
  lastMove?: { from: string; to: string } | null;
  /** Live position evaluation in centipawns, White's perspective. */
  evaluation?: number | null;
  mateScore?: number | null;
  isAnalyzing?: boolean;
  showEvaluationBar?: boolean;
}

export const ChessBoardWrapper: React.FC<ChessBoardWrapperProps> = ({
  fen,
  onMove,
  orientation = 'white',
  isInteractive = true,
  lastMove = null,
  evaluation = null,
  mateScore = null,
  isAnalyzing = false,
  showEvaluationBar = true,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // The position can change from outside (opponent move, New Game, loading a drill). Any pending
  // selection or promotion prompt refers to the old position, and leaving a promotion modal open
  // would block input entirely.
  useEffect(() => {
    setSelectedSquare(null);
    setPromotionMove(null);
  }, [fen]);

  // Instantiated chess instance to calculate legal moves and check states
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  // Find king in check for highlighting
  const inCheckSquare = useMemo<Square | null>(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return piece.square as Square;
        }
      }
    }
    return null;
  }, [chess]);

  // Calculate legal moves from the selected square
  const legalMoves = useMemo<Array<{ to: Square; isCapture: boolean }>>(() => {
    if (!selectedSquare || !isInteractive) return [];
    try {
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      return moves.map(m => ({
        to: m.to as Square,
        isCapture: m.captured !== undefined || m.flags.includes('c') || m.flags.includes('e'),
      }));
    } catch {
      return [];
    }
  }, [chess, selectedSquare, isInteractive]);

  // Single authoritative move executor
  const executeMove = useCallback(
    (source: string, target: string): boolean => {
      if (!isInteractive || !onMove) return false;

      // Check if move is a pawn promotion
      const piece = chess.get(source as Square);
      const isPawn = piece && piece.type === 'p';
      const isPromotionRank = (piece?.color === 'w' && target[1] === '8') || (piece?.color === 'b' && target[1] === '1');

      if (isPawn && isPromotionRank) {
        // Trigger promotion selector modal
        setPromotionMove({ from: source, to: target });
        return true;
      }

      const success = onMove(source, target);
      if (success) {
        setSelectedSquare(null);
      }
      return success;
    },
    [isInteractive, onMove, chess]
  );

  // Drag-and-drop drop handler
  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
      if (!targetSquare) return false;
      return executeMove(sourceSquare, targetSquare);
    },
    [executeMove]
  );

  // Click-to-select and click-to-move square click handler
  const handleSquareClick = useCallback(
    ({ square }: { square: string }) => {
      if (!isInteractive) return;

      const sq = square as Square;
      const pieceOnSquare = chess.get(sq);
      const currentTurn = chess.turn();

      // Case 1: No piece currently selected
      if (!selectedSquare) {
        if (pieceOnSquare && pieceOnSquare.color === currentTurn) {
          setSelectedSquare(sq);
        }
        return;
      }

      // Case 2: Clicked the same selected piece -> Deselect
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      // Case 3: Clicked another friendly piece -> Switch selection
      if (pieceOnSquare && pieceOnSquare.color === currentTurn) {
        setSelectedSquare(sq);
        return;
      }

      // Case 4: Clicked a square with an active selection
      const isLegal = legalMoves.some(m => m.to === sq);
      if (isLegal) {
        executeMove(selectedSquare, sq);
      } else {
        // Clicked an invalid square -> deselect
        setSelectedSquare(null);
      }
    },
    [isInteractive, chess, selectedSquare, legalMoves, executeMove]
  );

  // Generate dynamic square styling for selection, legal destinations, captures, and check
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move highlights
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(229, 184, 66, 0.25)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(229, 184, 66, 0.35)' };
    }

    // 2. Selected square highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(229, 184, 66, 0.55)',
        boxShadow: 'inset 0 0 0 3px #E5B842',
      };
    }

    // 3. Legal move dots and capture rings
    legalMoves.forEach(({ to, isCapture }) => {
      if (isCapture) {
        styles[to] = {
          background: 'radial-gradient(circle, transparent 55%, rgba(239, 68, 68, 0.75) 56%, rgba(239, 68, 68, 0.75) 75%, transparent 76%)',
          borderRadius: '50%',
          cursor: 'pointer',
        };
      } else {
        styles[to] = {
          background: 'radial-gradient(circle, rgba(229, 184, 66, 0.75) 24%, transparent 25%)',
          borderRadius: '50%',
          cursor: 'pointer',
        };
      }
    });

    // 4. King in check highlight
    if (inCheckSquare) {
      styles[inCheckSquare] = {
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        boxShadow: 'inset 0 0 0 3px #EF4444',
      };
    }

    return styles;
  }, [selectedSquare, legalMoves, inCheckSquare, lastMove]);

  // Handle promotion choice
  const handlePromotionSelect = (promoPiece: 'q' | 'r' | 'b' | 'n') => {
    if (promotionMove && onMove) {
      onMove(promotionMove.from, `${promotionMove.to}${promoPiece}`);
      setPromotionMove(null);
      setSelectedSquare(null);
    }
  };

  const isGameOver = chess.isGameOver();
  const gameOverReason = chess.isCheckmate()
    ? `CHECKMATE — ${chess.turn() === 'w' ? 'BLACK' : 'WHITE'} WINS`
    : chess.isStalemate()
    ? 'DRAW BY STALEMATE'
    : chess.isThreefoldRepetition()
    ? 'DRAW BY THREEFOLD REPETITION'
    : chess.isInsufficientMaterial()
    ? 'DRAW BY INSUFFICIENT MATERIAL'
    : null;

  return (
    <div className="relative w-full max-w-[580px] flex flex-col items-stretch gap-3">
      {/* Evaluation bar + board share a row so the bar always matches the board height */}
      <div className="flex items-stretch gap-3">
        {showEvaluationBar && (
          <EvaluationBar
            evaluation={evaluation}
            mateScore={mateScore}
            orientation={orientation}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Board Container */}
        <div className="relative flex-1 aspect-square p-2 sm:p-3 bg-[#12151B] border-2 border-[#242A35] shadow-brutal-lg select-none">
          <Chessboard
            options={{
              position: fen,
              boardOrientation: orientation,
              onPieceDrop: handlePieceDrop,
              onSquareClick: handleSquareClick,
              allowDragging: isInteractive && !isGameOver,
              squareStyles: customSquareStyles,
              darkSquareStyle: { backgroundColor: '#262F3D' },
              lightSquareStyle: { backgroundColor: '#B8C6D4' },
              animationDurationInMs: 150,
            }}
          />

          {/* Game Over Banner Overlay */}
          {isGameOver && gameOverReason && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="p-4 bg-[#181C24] border-2 border-[#E5B842] shadow-brutal-lg max-w-xs">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#E5B842]">
                  GAME CONCLUSION
                </span>
                <h3 className="text-base font-black uppercase text-[#F0F3F8] mt-1">
                  {gameOverReason}
                </h3>
              </div>
            </div>
          )}

          {/* Promotion Selection Modal */}
          {promotionMove && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-40">
              <div className="p-5 bg-[#181C24] border-2 border-[#E5B842] shadow-brutal-lg flex flex-col items-center gap-4">
                <h4 className="font-black text-xs uppercase tracking-widest text-[#E5B842]">
                  SELECT PROMOTION PIECE
                </h4>
                <div className="flex items-center gap-3">
                  {[
                    { label: '♕ Queen', key: 'q' as const },
                    { label: '♖ Rook', key: 'r' as const },
                    { label: '♗ Bishop', key: 'b' as const },
                    { label: '♘ Knight', key: 'n' as const },
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => handlePromotionSelect(p.key)}
                      className="px-3 py-2 bg-[#12151B] border border-[#242A35] hover:border-[#E5B842] text-[#F0F3F8] font-bold text-xs uppercase cursor-pointer hover:bg-[#E5B842]/10 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Turn & Status Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#12151B] border border-[#242A35] font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${chess.turn() === 'w' ? 'bg-[#F0F3F8]' : 'bg-[#0B0D10] border border-[#94A0B8]'}`} />
          <span className="font-bold text-[#94A0B8]">
            TURN: <strong className="text-[#F0F3F8]">{chess.turn() === 'w' ? 'WHITE TO MOVE' : 'BLACK TO MOVE'}</strong>
          </span>
        </div>

        {inCheckSquare && !isGameOver && (
          <span className="font-extrabold text-[#EF4444] animate-pulse">
            ⚠️ CHECK
          </span>
        )}
      </div>
    </div>
  );
};
