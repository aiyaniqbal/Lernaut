"use client";

import React from 'react';
import { BRAND_CONFIG } from '../../data/landingData';
import { useAuth } from '../../hooks/useAuth';

export const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-[#E4DFFF] pt-14 pb-10 text-[#77738D] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#E4DFFF]">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6847FF] to-[#8F75FF] flex items-center justify-center text-white font-black text-base shadow-sm">
                <span className="font-fredoka tracking-tighter">L</span>
              </div>
              <span className="text-xl font-fredoka font-bold tracking-tight text-[#24213A]">
                {BRAND_CONFIG.name}
              </span>
            </div>

            <p className="text-xs font-bold text-[#6847FF] uppercase tracking-wider mb-2">
              {BRAND_CONFIG.tagline}
            </p>

            <p className="text-xs text-[#77738D] max-w-sm leading-relaxed">
              Transforming raw study materials into personalized interactive lessons, targeted quizzes, and habit-forming progression.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#24213A] mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <button
                  onClick={() => handleScroll('top')}
                  className="hover:text-[#6847FF] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('how-it-works')}
                  className="hover:text-[#6847FF] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('features')}
                  className="hover:text-[#6847FF] transition-colors cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('gamified-learning')}
                  className="hover:text-[#6847FF] transition-colors cursor-pointer"
                >
                  Gamified Roadmap
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScroll('about-us')}
                  className="hover:text-[#6847FF] transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Account / Learning Access */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#24213A] mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {isAuthenticated ? (
                <>
                  <li>
                    <a href="#/dashboard" className="hover:text-[#6847FF] transition-colors">
                      Student Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="#/profile" className="hover:text-[#6847FF] transition-colors">
                      My Profile
                    </a>
                  </li>
                  <li>
                    <a href="#/learn" className="hover:text-[#6847FF] transition-colors">
                      AI Teacher Workspace
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="#/login" className="hover:text-[#6847FF] transition-colors">
                      Sign in
                    </a>
                  </li>
                  <li>
                    <a href="#/signup" className="hover:text-[#6847FF] transition-colors">
                      Sign up
                    </a>
                  </li>
                </>
              )}
              <li className="pt-2 text-[11px] text-[#77738D]/80">
                <span>Designed for learners worldwide</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#77738D] gap-4">
          <p>© {currentYear} Lernaut. All rights reserved.</p>
          <p className="text-[11px]">
            Personalized AI Learning Platform • Founded by Aiyan Iqbal & MD Shoaib Ansari
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
