'use client';

import React from 'react';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'acid' | 'outline';
  children: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  variant = 'secondary',
  children,
  className = '',
  ...props
}) => {
  let variantStyles = 'bg-[#F2F0E6] text-[#111111]';
  if (variant === 'primary') variantStyles = 'bg-[#FF4D00] text-[#111111]';
  if (variant === 'acid') variantStyles = 'bg-[#D7FF00] text-[#111111]';
  if (variant === 'outline') variantStyles = 'bg-white text-[#111111]';

  return (
    <button
      className={`border-3 border-[#111111] font-black uppercase text-xs tracking-wider px-5 py-2.5 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
