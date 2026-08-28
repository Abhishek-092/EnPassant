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
  let variantStyles = 'bg-[#181C24] text-[#F0F3F8] border-[#242A35] hover:border-[#E5B842] hover:text-[#E5B842]';
  if (variant === 'primary') variantStyles = 'bg-[#E5B842] text-[#0B0D10] border-[#E5B842] hover:bg-[#F0C450] shadow-[3px_3px_0px_#8C6B18]';
  if (variant === 'acid') variantStyles = 'bg-[#1F2430] text-[#E5B842] border-[#E5B842] hover:bg-[#252B3A]';
  if (variant === 'outline') variantStyles = 'bg-transparent text-[#F0F3F8] border-[#242A35] hover:border-[#E5B842] hover:bg-[#181C24]';

  return (
    <button
      className={`border-2 font-extrabold uppercase text-xs tracking-wider px-5 py-2.5 shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
