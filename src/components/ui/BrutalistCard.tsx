'use client';

import React from 'react';

interface BrutalistCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'none' | 'orange' | 'acid';
}

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  className = '',
  accent = 'none',
}) => {
  let accentBorder = 'border-[#111111]';
  if (accent === 'orange') accentBorder = 'border-[#FF4D00]';

  return (
    <div className={`p-6 bg-white border-3 ${accentBorder} shadow-brutal text-[#111111] ${className}`}>
      {children}
    </div>
  );
};
