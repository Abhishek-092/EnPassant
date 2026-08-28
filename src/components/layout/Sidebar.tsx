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
  Flame,
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
      <div className="md:hidden flex items-center justify-between p-4 bg-[#111111] text-[#F2F0E6] border-b-3 border-[#111111] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FF4D00] border-2 border-[#F2F0E6] flex items-center justify-center font-black text-black text-sm">
            ⚡
          </div>
          <span className="font-black text-base tracking-widest text-[#F2F4F7]">ENPASSANT</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="px-3 py-1.5 bg-[#FF4D00] text-black border-2 border-[#F2F0E6] font-black text-xs uppercase"
        >
          MENU ☰
        </button>
      </div>

      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-[#111111] text-[#F2F0E6] border-r-3 border-[#111111] flex-col justify-between p-5 h-auto md:h-screen md:sticky md:top-0 z-40`}
      >
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3 border-b-3 border-[#2A2E35] pb-5">
            <div className="w-10 h-10 bg-[#FF4D00] border-3 border-[#F2F0E6] flex items-center justify-center font-black text-black text-xl shadow-brutal-sm">
              ⚡
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-[#F2F4F7]">ENPASSANT</h1>
              <p className="text-[9px] font-mono text-[#D7FF00] tracking-widest uppercase">CHESS LABORATORY</p>
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
                  className={`flex items-center gap-3 px-4 py-3 border-2 font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#FF4D00] text-[#111111] border-[#F2F0E6] shadow-brutal-sm translate-x-1'
                      : 'bg-[#181818] text-[#F2F0E6] border-transparent hover:border-[#FF4D00] hover:text-[#FF4D00]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Action */}
        <div className="flex flex-col gap-3 pt-5 border-t-3 border-[#2A2E35]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 bg-[#181818] border-2 border-transparent hover:border-[#D7FF00] text-xs font-bold uppercase tracking-wider text-[#8A919C] hover:text-[#D7FF00]"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-2.5 bg-[#E32636] border-2 border-[#111111] text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 transition-all shadow-brutal-sm"
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


