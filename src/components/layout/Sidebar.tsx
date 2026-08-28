'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Swords,
  RotateCcw,
  BarChart3,
  User,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../firebase/auth';
import { BrutalistButton } from '../ui/BrutalistButton';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, signInWithGoogle } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Openings', href: '/openings', icon: BookOpen },
    { name: 'Train', href: '/train', icon: Target },
    { name: 'Games', href: '/games', icon: Swords },
    { name: 'Replay & Correct', href: '/replay', icon: RotateCcw },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setAuthLoading(false);
    }
  };

  const isGuest = !user || user.uid.startsWith('guest_') || user.uid.startsWith('demo_');

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#12151B] text-[#F0F3F8] border-b-2 border-[#242A35] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E5B842] border border-[#C99E30] flex items-center justify-center font-black text-[#0B0D10] text-sm">
            ⚡
          </div>
          <span className="font-extrabold text-base tracking-widest text-[#F0F3F8]">ENPASSANT</span>
        </div>
        <div className="flex items-center gap-2">
          {isGuest ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="px-2.5 py-1 bg-[#E5B842] text-[#0B0D10] font-black text-xs uppercase flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </button>
          ) : null}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="px-3 py-1.5 bg-[#181C24] text-[#E5B842] border border-[#242A35] font-bold text-xs uppercase"
          >
            MENU ☰
          </button>
        </div>
      </div>

      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-[#12151B] text-[#F0F3F8] border-r-2 border-[#242A35] flex-col justify-between p-5 h-auto md:h-screen md:sticky md:top-0 z-40`}
      >
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b-2 border-[#242A35] pb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E5B842] to-[#C99E30] border border-[#F0C450] flex items-center justify-center font-black text-[#0B0D10] text-xl shadow-brutal-sm">
              ⚡
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-[#F0F3F8]">ENPASSANT</h1>
              <p className="text-[10px] font-mono font-bold text-[#E5B842] tracking-widest uppercase">CHESS LABORATORY</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 border font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#181C24] text-[#E5B842] border-[#E5B842] shadow-brutal-sm translate-x-1'
                      : 'bg-[#12151B] text-[#94A0B8] border-transparent hover:border-[#242A35] hover:bg-[#181C24] hover:text-[#F0F3F8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5B842]' : 'text-[#64748B]'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Google Sign-In Action */}
        <div className="flex flex-col gap-3 pt-5 border-t-2 border-[#242A35]">
          {isGuest ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#E5B842] hover:bg-[#F0C450] text-[#0B0D10] font-black text-xs uppercase tracking-wider shadow-brutal transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {authLoading ? 'Signing In...' : 'Sign In with Google'}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-[#181C24] border border-[#242A35] text-xs">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="font-mono text-[11px] text-[#F0F3F8] truncate">
                  {user.displayName || user.email}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#181C24] border border-[#EF4444]/40 text-xs font-bold uppercase tracking-wider text-[#F87171] hover:bg-[#EF4444]/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}

          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2 bg-[#181C24] border border-[#242A35] hover:border-[#E5B842] text-xs font-bold uppercase tracking-wider text-[#94A0B8] hover:text-[#E5B842] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
};
