'use client';

import React from 'react';
import { Chessboard } from 'react-chessboard';

interface ChessBoardWrapperProps {
  fen: string;
  onMove?: (sourceSquare: string, targetSquare: string) => boolean;
  orientation?: 'white' | 'black';
  showArrows?: boolean;
  customArrows?: Array<[string, string, string?]>;
  isInteractive?: boolean;
}

export const ChessBoardWrapper: React.FC<ChessBoardWrapperProps> = ({
  fen,
  onMove,
  orientation = 'white',
  isInteractive = true,
}) => {
  function handlePieceDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean {
    if (!isInteractive || !onMove || !targetSquare) return false;
    return onMove(sourceSquare, targetSquare);
  }

  return (
    <div className="relative w-full max-w-[540px] aspect-square mx-auto flex items-center justify-center p-2 rounded-xl bg-[#15171B] border border-[#2A2E35] shadow-2xl">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          onPieceDrop: handlePieceDrop,
          allowDragging: isInteractive,
          darkSquareStyle: { backgroundColor: '#2B3544' },
          lightSquareStyle: { backgroundColor: '#779954' },
        }}
      />
    </div>
  );
};


