'use client';

import React from 'react';

interface BrutalistBadgeProps {
  variant?: 'default' | 'orange' | 'acid' | 'dark' | 'success' | 'error';
  children: React.ReactNode;
}

export const BrutalistBadge: React.FC<BrutalistBadgeProps> = ({
  variant = 'default',
  children,
}) => {
  let style = 'bg-[#F2F0E6] text-[#111111] border-[#111111]';
  if (variant === 'orange') style = 'bg-[#FF4D00] text-[#111111] border-[#111111]';
  if (variant === 'acid') style = 'bg-[#D7FF00] text-[#111111] border-[#111111]';
  if (variant === 'dark') style = 'bg-[#111111] text-[#F2F0E6] border-[#111111]';
  if (variant === 'success') style = 'bg-[#19A463] text-white border-[#111111]';
  if (variant === 'error') style = 'bg-[#E32636] text-white border-[#111111]';

  return (
    <span className={`inline-block border-2 font-mono font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 ${style}`}>
      {children}
    </span>
  );
};
