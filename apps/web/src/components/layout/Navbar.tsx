import React from 'react';
import {
  ArrowLeft,
  Flame,
  Globe,
  Menu,
} from 'lucide-react';
import { LanguageCode, PageId } from '../../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onBack: () => void;
  canGoBack: boolean;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  streakDays: number;
  currentTopic: string;
  timeRemaining?: string;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onBack,
  canGoBack,
  language,
  onLanguageChange,
  streakDays,
  currentTopic,
  timeRemaining = '14:32 remaining',
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b-2 border-line shadow-sm flex items-center justify-between px-4 sm:px-8">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg hover:bg-cloud text-ink/60 transition-colors"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={onBack}
              disabled={!canGoBack && currentPage === 'dashboard'}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                canGoBack || currentPage !== 'dashboard'
                  ? 'bg-cloud hover:bg-violet/20 text-ink/80 hover:text-violet border border-line cursor-pointer active:scale-95'
                  : 'text-ink/70 cursor-default opacity-50'
              }`}
              title="Return to previous screen"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Logo + App Name */}
            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black italic text-sm shadow-lg shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all border border-indigo-400/20">
                L
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-fredoka font-bold tracking-tight text-ink transition-colors">
                    Lernaut
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-cloud rounded-2xl p-1 border border-line shadow-inner">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'learn', label: 'AI Teacher' },
            { id: 'materials', label: 'Materials' },
            { id: 'roadmap', label: 'Roadmap' },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'quiz', label: 'Quiz' },
          ].map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as PageId)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-violet text-ink border-b-4 border-violet-edge active:border-b-0 active:translate-y-[4px]'
                    : 'text-ink/60 hover:text-ink hover:bg-cloud'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Area: Study Streak, Language Selector, Remaining Time, Profile */}
        <div className="flex items-center space-x-3">
          {/* Study Streak */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-flame/10 border border-flame/20 text-xs font-bold text-flame"
            title={`${streakDays} days consecutive study streak!`}
          >
            <Flame className="w-3.5 h-3.5 text-flame fill-flame" />
            <span>{streakDays}d</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="bg-cloud border border-line text-xs font-bold px-3 py-1.5 rounded-lg text-ink focus:outline-none focus:border-violet cursor-pointer shadow-sm"
            >
              <option value="English">🇬🇧 English</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="Hinglish">🇮🇳 Hinglish</option>
            </select>
          </div>

          {/* Remaining Time */}
          <div className="hidden sm:block text-xs font-mono bg-berry/10 text-berry px-3 py-1.5 rounded-lg border border-berry/20 font-medium">
            {timeRemaining.includes('remaining') ? timeRemaining : `${timeRemaining} remaining`}
          </div>

          {/* Student Profile Quick Avatar */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-cloud transition-colors ml-1"
            title="View Profile & Learning Preferences"
          >
            <div className="w-8 h-8 rounded-full bg-violet flex items-center justify-center text-ink font-bold text-xs shadow-md border border-line">
              A
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
