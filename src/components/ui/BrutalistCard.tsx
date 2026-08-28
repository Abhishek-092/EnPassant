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
  let accentBorder = 'border-[#242A35]';
  if (accent === 'orange' || accent === 'acid') accentBorder = 'border-[#E5B842]';

  return (
    <div className={`p-6 bg-[#12151B] border-2 ${accentBorder} shadow-brutal text-[#F0F3F8] ${className}`}>
      {children}
    </div>
  );
};
