"use client";

import React from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  Play,
  Flame,
  Trophy,
  Star,
  Target,
} from 'lucide-react';

export const GamifiedSection: React.FC = () => {
  return (
    <section id="gamified-learning" className="py-20 md:py-28 bg-white border-t border-[#E4DFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E4DFFF]">
            <Trophy className="w-3.5 h-3.5" />
            <span>Gamified Learning Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            Every lesson moves you forward.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#77738D]">
            Turn study time into sustained momentum with clear milestones, experience points, streak habits, and tier badges earned through genuine effort.
          </p>
        </div>

        {/* Visual Showcase Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Illustrative Learning Path (Completed, Active, Locked nodes) */}
          <div className="lg:col-span-7 bg-[#F8F6FF] rounded-3xl p-6 sm:p-8 border-2 border-[#E4DFFF] shadow-md">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4DFFF]">
              <div>
                <h3 className="text-lg font-bold text-[#24213A]">Interactive Roadmap Track</h3>
                <p className="text-xs text-[#77738D]">Calculus & Linear Algebra Foundations</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#2ED47A]/15 text-[#1FA85F] text-xs font-extrabold">
                Unit 2 in Progress
              </span>
            </div>

            {/* Path Nodes */}
            <div className="space-y-4 relative">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-8 bottom-8 w-1 bg-[#E4DFFF] -z-0" />

              {/* Node 1: Completed */}
              <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#2ED47A]/40 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#2ED47A] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#2ED47A]">
                      Node 01 • Completed
                    </span>
                    <span className="text-xs font-bold text-[#2ED47A]">+100 XP</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#24213A] mt-0.5">
                    Limits, Continuity & Derivative Intuition
                  </h4>
                  <p className="text-xs text-[#77738D] mt-1">
                    Mastered quick checks, practice quizzes, and concept notes.
                  </p>
                </div>
              </div>

              {/* Node 2: Active / In Progress */}
              <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white border-2 border-[#6847FF] shadow-md shadow-[#6847FF]/10">
                <div className="w-12 h-12 rounded-xl bg-[#6847FF] text-white flex items-center justify-center font-bold shrink-0 shadow-sm animate-pulse">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#6847FF]">
                      Node 02 • Currently Studying
                    </span>
                    <span className="text-xs font-bold text-[#6847FF]">In Progress</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#24213A] mt-0.5">
                    Chain Rule, Implicit Differentiation & Applications
                  </h4>
                  <div className="mt-2 w-full bg-[#F3EFFF] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#6847FF] h-full rounded-full w-[60%]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#77738D] mt-1 block">
                    3 of 5 topics completed • 60% mastery
                  </span>
                </div>
              </div>

              {/* Node 3: Locked */}
              <div className="relative z-10 flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-[#E4DFFF] opacity-75">
                <div className="w-12 h-12 rounded-xl bg-[#E4DFFF] text-[#77738D] flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#77738D] uppercase tracking-wide">
                      Node 03 • Locked
                    </span>
                    <span className="text-xs text-[#77738D]">Requires Node 02</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#77738D] mt-0.5">
                    Optimization, Related Rates & Applied Modeling
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Previews of XP, Levels, Achievements & Daily Activity */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Level & XP Card */}
            <div className="bg-[#F8F6FF] rounded-2xl p-5 border border-[#E4DFFF] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC93C] text-[#24213A] flex items-center justify-center font-black">
                    <Star className="w-4 h-4 fill-[#24213A]" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase text-[#24213A]">Scholar Tier IV</span>
                    <p className="text-[11px] text-[#77738D]">Level 4 • 2,175 / 3,000 XP</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#6847FF] bg-[#F3EFFF] px-2.5 py-1 rounded-lg border border-[#E4DFFF]">
                  Next: Tier V
                </span>
              </div>
              <div className="w-full bg-[#E4DFFF] h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#6847FF] to-[#FFC93C] h-full rounded-full w-[72%]" />
              </div>
            </div>

            {/* Verified Achievements Card */}
            <div className="bg-[#F8F6FF] rounded-2xl p-5 border border-[#E4DFFF] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#24213A] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#6847FF]" /> Unlocked Milestones
                </span>
                <span className="text-xs font-bold text-[#6847FF]">5 of 12 Badges</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-[#E4DFFF]">
                  <span className="text-xl block mb-1">⚡</span>
                  <span className="text-[10px] font-bold text-[#24213A] block">First Spark</span>
                  <span className="text-[9px] text-[#2ED47A] font-bold">Unlocked</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E4DFFF]">
                  <span className="text-xl block mb-1">🔥</span>
                  <span className="text-[10px] font-bold text-[#24213A] block">7-Day Fire</span>
                  <span className="text-[9px] text-[#2ED47A] font-bold">Unlocked</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E4DFFF]">
                  <span className="text-xl block mb-1">🎯</span>
                  <span className="text-[10px] font-bold text-[#24213A] block">Quiz Ace</span>
                  <span className="text-[9px] text-[#2ED47A] font-bold">Unlocked</span>
                </div>
              </div>
            </div>

            {/* Daily Habit & Streak Goal */}
            <div className="bg-[#F8F6FF] rounded-2xl p-5 border border-[#E4DFFF] shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide text-[#24213A] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#FF5C7A]" /> Daily Study Mission
                </span>
                <p className="text-xs text-[#77738D] mt-1">Complete 1 AI lecture & 1 quiz</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-[#2ED47A] block">15 / 20 XP</span>
                <span className="text-[10px] text-[#77738D] font-bold">Resets 12:00 AM IST</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
export default GamifiedSection;
