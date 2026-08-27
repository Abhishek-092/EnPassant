import './globals.css';
import React from 'react';
import { AuthProvider } from '@/firebase/auth';

export const metadata = {
  title: 'Opening Forge - Learn Your Openings. Train Your Mistakes.',
  description: 'Adaptive chess opening learning platform with Stockfish MultiPV analysis, automated game sync, and personal mistake training.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0E0F11] text-[#F2F4F7] antialiased selection:bg-[#D6B15E] selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
