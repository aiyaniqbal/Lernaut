"use client";

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  Play,
  Volume2,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeroSectionProps {
  onNavigateToApp?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateToApp }) => {
  const { isAuthenticated } = useAuth();

  const handlePrimaryClick = () => {
    if (isAuthenticated && onNavigateToApp) {
      onNavigateToApp();
    } else {
      window.location.hash = '#/signup';
    }
  };

  const handleSecondaryClick = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="top" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#6847FF]/15 to-[#FFC93C]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top announcement badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-[#E4DFFF] shadow-[0_4px_16px_rgba(104,71,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <span className="flex h-2 w-2 rounded-full bg-[#6847FF] animate-pulse" />
            <span className="text-xs font-bold text-[#6847FF] uppercase tracking-wider">
              ✦ Next-Gen AI Study Companion
            </span>
          </div>
        </div>

        {/* Hero Headings */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-fredoka text-[#24213A] tracking-tight leading-[1.12]">
            Your Notes.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6847FF] to-[#8F75FF]">
              Your AI Teacher.
            </span>{' '}
            Your Next Level.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#77738D] font-medium max-w-2xl mx-auto leading-relaxed">
            Turn your study materials into personalized lessons, interactive quizzes, and learning quests designed around your pace and progress.
          </p>

          {/* Action CTAs with Glassmorphism */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePrimaryClick}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#6847FF] to-[#7B5CFF] hover:from-[#5B3BEF] hover:to-[#6E4EFA] text-white font-black text-base rounded-2xl shadow-[0_10px_32px_rgba(104,71,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_14px_42px_rgba(104,71,255,0.48)] border border-white/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer backdrop-blur-md"
            >
              <span>{isAuthenticated ? 'Continue Learning' : 'Start Learning'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleSecondaryClick}
              className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-[#24213A] border border-[#E4DFFF] border-t-white/80 font-bold text-base rounded-2xl shadow-[0_8px_24px_rgba(37,32,70,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_12px_32px_rgba(104,71,255,0.12)] hover:border-[#6847FF]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 backdrop-blur-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Explore Your Learning Journey' : 'Explore Features'}</span>
            </button>
          </div>

          {/* Micro trust indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-[#77738D]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> Grounded in your notes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> English, Hindi & Hinglish
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ED47A]" /> Verified XP progression
            </span>
          </div>
        </div>

        {/* ================= HERO PRODUCT SHOWCASE ================= */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border-2 border-[#E4DFFF] shadow-[0_20px_50px_rgba(104,71,255,0.08)] p-4 sm:p-7 relative overflow-hidden">
            {/* Top Showcase Toolbar */}
            <div className="flex flex-wrap items-center justify-between pb-5 mb-5 border-b border-[#E4DFFF] gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono font-bold text-[#77738D]">
                  Lernaut • Live Study Session
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#F3EFFF] text-[#6847FF] text-xs font-bold border border-[#E4DFFF]">
                  Level 4 Scholar • 2,175 XP • Rank #1
                </span>
              </div>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Personalized Lecture Card */}
              <div className="lg:col-span-7 bg-[#F8F6FF] rounded-2xl p-5 border border-[#E4DFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#6847FF]/10 text-[#6847FF] text-xs font-extrabold uppercase tracking-wide">
                      Interactive Lecture
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#77738D]">
                      <Volume2 className="w-3.5 h-3.5 text-[#6847FF]" />
                      <span>AI Teacher Audio Active</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#24213A] mb-1">
                    Cell Biology: ATP Synthesis & Cellular Respiration
                  </h3>
                  <p className="text-xs text-[#77738D] leading-relaxed mb-4">
                    Grounded in uploaded lecture slides: Mitochondria structure, electron transport chain, and ATP synthase analogy.
                  </p>

                  {/* Speech snippet */}
                  <div className="bg-white rounded-xl p-3.5 border border-[#E4DFFF] shadow-sm mb-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#6847FF] text-white flex items-center justify-center font-black text-xs shrink-0">
                        L
                      </div>
                      <div className="text-xs text-[#24213A] leading-relaxed">
                        <span className="font-bold text-[#6847FF]">AI Teacher:</span> "Think of ATP as the rechargeable battery of your cells. When glucose breaks down, energy is stored in phosphate bonds ready for cellular work..."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio visualizer bar */}
                <div className="flex items-center justify-between bg-white/80 rounded-xl px-3.5 py-2 border border-[#E4DFFF]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#6847FF] text-white flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </div>
                    <span className="text-xs font-bold text-[#24213A]">Lesson Part 1 of 3</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 rounded-full bg-[#6847FF] animate-pulse" />
                    <span className="w-1 h-5 rounded-full bg-[#6847FF] animate-pulse" />
                    <span className="w-1 h-2 rounded-full bg-[#6847FF]" />
                    <span className="w-1 h-4 rounded-full bg-[#6847FF] animate-pulse" />
                    <span className="w-1 h-3 rounded-full bg-[#6847FF]" />
                  </div>
                </div>
              </div>

              {/* Right Column: Quiz & Progress Cards */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Instant Check Quiz Card */}
                <div className="bg-[#F8F6FF] rounded-2xl p-4 border border-[#E4DFFF]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#6847FF] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Quick Check
                    </span>
                    <span className="text-[11px] font-bold text-[#2ED47A] bg-[#2ED47A]/10 px-2 py-0.5 rounded-md">
                      +15 XP Earned
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#24213A] mb-2.5">
                    Which organelle acts as the powerhouse producing cellular ATP?
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 rounded-lg bg-[#2ED47A]/10 border border-[#2ED47A]/30 text-[#1FA85F] font-bold flex items-center justify-between">
                      <span>✓ Mitochondria</span>
                      <span className="text-[10px] bg-[#2ED47A] text-white px-1.5 py-0.5 rounded">Correct</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#E4DFFF] text-[#77738D]">
                      ○ Ribosome
                    </div>
                  </div>
                </div>

                {/* Learning Path & Progress Pill */}
                <div className="bg-[#F8F6FF] rounded-2xl p-4 border border-[#E4DFFF]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#24213A] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#6847FF]" /> Course Roadmap
                    </span>
                    <span className="font-extrabold text-[#6847FF]">Unit 2 Active</span>
                  </div>
                  <div className="w-full bg-[#E4DFFF] h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-[#6847FF] h-full rounded-full w-[65%]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#77738D] font-semibold">
                    <span>Mastery: 84%</span>
                    <span>Daily Goal: 15/20 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
