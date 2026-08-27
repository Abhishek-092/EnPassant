'use client';

import React from 'react';
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
    <aside className="w-64 bg-[#15171B] border-r border-[#2A2E35] flex flex-col justify-between p-4 h-screen sticky top-0 text-[#F2F4F7]">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#D6B15E] to-[#B38E3F] flex items-center justify-center font-bold text-black text-lg shadow-lg">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wider text-[#F2F4F7]">OPENING FORGE</h1>
            <p className="text-[10px] text-[#8A919C] tracking-wide">ADAPTIVE CHESS COACH</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1C1F24] text-[#D6B15E] border border-[#2A2E35]'
                    : 'text-[#8A919C] hover:text-[#F2F4F7] hover:bg-[#1C1F24]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D6B15E]' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Quick Action */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#2A2E35]">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#D6B15E]" />
            <span className="text-xs font-semibold text-[#8A919C]">Streak:</span>
          </div>
          <span className="text-xs font-bold text-[#D6B15E] bg-[#D6B15E]/10 px-2 py-0.5 rounded border border-[#D6B15E]/30">
            5 Days 🔥
          </span>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#8A919C] hover:text-[#F2F4F7] hover:bg-[#1C1F24]"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {user && (
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#D95D5D] hover:bg-[#D95D5D]/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout ({user.displayName?.split(' ')[0]})
          </button>
        )}
      </div>
    </aside>
  );
};
