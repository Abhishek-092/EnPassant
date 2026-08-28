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
} from 'lucide-react';
import { useAuth } from '../../firebase/auth';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Openings', href: '/openings', icon: BookOpen },
    { name: 'Train', href: '/train', icon: Target },
    { name: 'Games', href: '/games', icon: Swords },
    { name: 'Replay & Correct', href: '/replay', icon: RotateCcw },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

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
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="px-3 py-1.5 bg-[#181C24] text-[#E5B842] border border-[#242A35] font-bold text-xs uppercase"
        >
          MENU ☰
        </button>
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

        {/* User Footer & Action */}
        <div className="flex flex-col gap-3 pt-5 border-t-2 border-[#242A35]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 bg-[#181C24] border border-[#242A35] hover:border-[#E5B842] text-xs font-bold uppercase tracking-wider text-[#94A0B8] hover:text-[#E5B842] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-2.5 bg-[#181C24] border border-[#EF4444]/40 text-xs font-bold uppercase tracking-wider text-[#F87171] hover:bg-[#EF4444]/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout ({user.displayName?.split(' ')[0]})
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
