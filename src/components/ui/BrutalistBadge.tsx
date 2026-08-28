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
  let style = 'bg-[#181C24] text-[#94A0B8] border-[#242A35]';
  if (variant === 'orange' || variant === 'acid') style = 'bg-[#E5B842]/15 text-[#E5B842] border-[#E5B842]/40';
  if (variant === 'dark') style = 'bg-[#0B0D10] text-[#E5B842] border-[#242A35]';
  if (variant === 'success') style = 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/40';
  if (variant === 'error') style = 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40';

  return (
    <span className={`inline-block border font-mono font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 ${style}`}>
      {children}
    </span>
  );
};
