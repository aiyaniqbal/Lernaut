"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Globe,
  Menu,
  X,
  ChevronDown,
  User,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { LanguageCode, PageId } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  currentPage?: PageId | 'home';
  onNavigate?: (page: PageId | 'home') => void;
  onBack?: () => void;
  canGoBack?: boolean;
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  isLandingPage?: boolean;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  currentPage = 'dashboard',
  onNavigate,
  onBack,
  canGoBack = false,
  language = 'English',
  onLanguageChange,
  isLandingPage = false,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAvatarMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleNavClick = (pageId: PageId | 'home') => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    setIsAvatarMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLandingScroll = (sectionId: string) => {
    if (isLandingPage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsAvatarMenuOpen(false);
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Get user initial
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const displayName = user?.name || 'Aiyan';

  return (
    <header className="sticky top-0 z-40 h-[68px] bg-white/90 backdrop-blur-xl border-b border-[#E4DFFF] shadow-[0_2px_16px_rgba(37,32,70,0.04)] flex items-center px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* ================= LEFT SECTION: Brand & Back ================= */}
        <div className="flex items-center gap-3">
          {/* Back button (Only in authenticated app views when not on home/dashboard) */}
          {isAuthenticated && !isLandingPage && (
            <button
              onClick={onBack}
              disabled={!canGoBack && currentPage === 'dashboard'}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                canGoBack || currentPage !== 'dashboard'
                  ? 'bg-[#F3EFFF] hover:bg-[#6847FF]/15 text-[#252046] hover:text-[#6847FF] border border-[#E4DFFF] cursor-pointer active:scale-95'
                  : 'text-[#77738D]/40 cursor-default opacity-40'
              }`}
              title="Return to previous screen"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Brand Logo & Wordmark */}
          <div
            onClick={() => handleNavClick(isAuthenticated && !isLandingPage ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavClick(isAuthenticated && !isLandingPage ? 'dashboard' : 'home')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6847FF] to-[#8F75FF] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-[#6847FF]/30 group-hover:scale-105 transition-transform border border-[#6847FF]/30">
              <span className="font-fredoka tracking-tighter">L</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-fredoka font-bold tracking-tight text-[#252046] group-hover:text-[#6847FF] transition-colors leading-tight">
                Lernaut
              </span>
            </div>
          </div>
        </div>

        {/* ================= CENTER SECTION: Primary Navigation ================= */}
        {isAuthenticated && !isLandingPage ? (
          /* Case B: Authenticated learning pages */
          <nav className="hidden lg:flex items-center space-x-1.5 bg-[#F3EFFF] rounded-2xl p-1.5 border border-[#E4DFFF] shadow-inner">
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
                  onClick={() => handleNavClick(item.id as PageId)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#6847FF] text-white shadow-sm shadow-[#6847FF]/25 font-bold'
                      : 'text-[#77738D] hover:text-[#252046] hover:bg-white/60 font-semibold'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          /* Case A: Public / Guest / Marketing navigation */
          <nav className="hidden md:flex items-center space-x-1 bg-[#F3EFFF] rounded-2xl p-1.5 border border-[#E4DFFF] shadow-inner">
            <button
              onClick={() => handleLandingScroll('top')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isLandingPage ? 'text-[#252046] hover:bg-white/60' : 'text-[#77738D] hover:text-[#252046]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleLandingScroll('how-it-works')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#77738D] hover:text-[#252046] hover:bg-white/60 transition-all"
            >
              How It Works
            </button>
            <button
              onClick={() => handleLandingScroll('features')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#77738D] hover:text-[#252046] hover:bg-white/60 transition-all"
            >
              Features
            </button>
            <button
              onClick={() => handleLandingScroll('about-us')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#77738D] hover:text-[#252046] hover:bg-white/60 transition-all"
            >
              About Us
            </button>
          </nav>
        )}

        {/* ================= RIGHT SECTION: Account Controls ================= */}
        <div className="flex items-center space-x-3">
          {/* Language Selector (Preserved for authenticated and guest) */}
          {onLanguageChange && (
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-1.5 bg-[#F3EFFF] border border-[#E4DFFF] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#252046] hover:border-[#6847FF]/40 transition-colors">
                <Globe className="w-3.5 h-3.5 text-[#6847FF]" />
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                  className="bg-transparent text-xs font-bold text-[#252046] focus:outline-none cursor-pointer pr-1"
                  aria-label="Select study language"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>
            </div>
          )}

          {/* Authenticated User Controls */}
          {isAuthenticated ? (
            <div className="relative" ref={avatarMenuRef}>
              <button
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#6847FF]/30 transition-all cursor-pointer"
                aria-expanded={isAvatarMenuOpen}
                aria-haspopup="true"
                aria-label="User account menu"
              >
                <div className="w-9 h-9 rounded-full bg-[#6847FF] text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white">
                  {userInitial}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#77738D] hidden sm:block" />
              </button>

              {/* Avatar Dropdown Menu */}
              {isAvatarMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-[#E4DFFF] py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* User Header */}
                  <div className="px-4 py-3 border-b border-[#E4DFFF]/80">
                    <p className="text-sm font-bold text-[#24213A] truncate">{displayName}</p>
                    <p className="text-xs text-[#77738D] truncate">{user?.email || 'aiyaniqbal77@gmail.com'}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F3EFFF] text-[10px] font-bold text-[#6847FF]">
                      <Sparkles className="w-3 h-3" />
                      <span>{user?.levelTitle || 'Scholar Tier IV'}</span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1">
                    <button
                      onClick={() => handleNavClick('profile')}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-[#24213A] hover:bg-[#F3EFFF] hover:text-[#6847FF] flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#77738D]" />
                      My Profile
                    </button>
                    <button
                      onClick={() => handleNavClick('dashboard')}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-[#24213A] hover:bg-[#F3EFFF] hover:text-[#6847FF] flex items-center gap-2.5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#77738D]" />
                      Dashboard
                    </button>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-1 border-t border-[#E4DFFF]/80">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest Actions with Glassmorphic CTAs */
            <div className="flex items-center gap-2.5">
              <a
                href="#/login"
                className="px-3.5 py-2 text-sm font-bold text-[#252046] hover:text-[#6847FF] hover:bg-[#F3EFFF]/80 rounded-xl transition-all"
              >
                Sign in
              </a>
              <a
                href="#/signup"
                className="px-4 py-2 bg-gradient-to-r from-[#6847FF] to-[#7B5CFF] hover:from-[#5B3BEF] hover:to-[#6E4EFA] text-white text-sm font-bold rounded-xl shadow-[0_4px_16px_rgba(104,71,255,0.32),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/20 hover:shadow-[0_6px_22px_rgba(104,71,255,0.45)] backdrop-blur-md transition-all active:scale-95"
              >
                Sign up
              </a>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#F3EFFF] text-[#252046] hover:text-[#6847FF] border border-[#E4DFFF] transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE DRAWER / MENU ================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[68px] bg-white border-b border-[#E4DFFF] shadow-xl p-4 z-50 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200">
          {isAuthenticated && !isLandingPage ? (
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1.5 text-xs font-bold text-[#77738D] uppercase tracking-wider">
                Learning Pages
              </div>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'learn', label: 'AI Teacher' },
                { id: 'materials', label: 'Materials' },
                { id: 'roadmap', label: 'Roadmap' },
                { id: 'leaderboard', label: 'Leaderboard' },
                { id: 'quiz', label: 'Quiz' },
                { id: 'profile', label: 'My Profile' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as PageId)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    currentPage === item.id
                      ? 'bg-[#6847FF] text-white'
                      : 'text-[#24213A] hover:bg-[#F3EFFF]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-2 border-t border-[#E4DFFF] mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleLandingScroll('top')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#24213A] hover:bg-[#F3EFFF]"
              >
                Home
              </button>
              <button
                onClick={() => handleLandingScroll('how-it-works')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#24213A] hover:bg-[#F3EFFF]"
              >
                How It Works
              </button>
              <button
                onClick={() => handleLandingScroll('features')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#24213A] hover:bg-[#F3EFFF]"
              >
                Features
              </button>
              <button
                onClick={() => handleLandingScroll('about-us')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#24213A] hover:bg-[#F3EFFF]"
              >
                About Us
              </button>

              <div className="pt-3 border-t border-[#E4DFFF] flex flex-col gap-2 mt-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="w-full py-2.5 bg-[#6847FF] text-white text-center font-bold rounded-xl shadow-sm text-sm"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <a
                      href="#/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center font-bold text-[#252046] bg-[#F3EFFF] rounded-xl text-sm"
                    >
                      Sign in
                    </a>
                    <a
                      href="#/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center font-bold text-white bg-[#6847FF] rounded-xl text-sm shadow-sm"
                    >
                      Sign up
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Language selection in mobile menu */}
          {onLanguageChange && (
            <div className="pt-2 border-t border-[#E4DFFF] flex items-center justify-between px-2 text-xs text-[#77738D]">
              <span className="font-semibold">Language:</span>
              <div className="flex gap-1.5">
                {(['English', 'Hindi', 'Hinglish'] as LanguageCode[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      language === lang
                        ? 'bg-[#6847FF] text-white'
                        : 'bg-[#F3EFFF] text-[#24213A]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export const Navbar = React.memo(NavbarComponent);
export default Navbar;
