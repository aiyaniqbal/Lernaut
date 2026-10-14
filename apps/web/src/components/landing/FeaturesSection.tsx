"use client";

import React from 'react';
import { CORE_FEATURES } from '../../data/landingData';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Compass,
  Sparkles,
  Award,
  BarChart3,
  Trophy,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType<any>> = {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Compass,
  Sparkles,
  Award,
  BarChart3,
  Trophy,
};

interface FeatureColorStyle {
  borderLeft: string;
  bg: string;
  iconBox: string;
  badge: string;
  footerText: string;
  dotColor: string;
}

const FEATURE_STYLES: FeatureColorStyle[] = [
  // 1. Personalized AI Teacher — Purple
  {
    borderLeft: 'border-l-[#6847FF] hover:border-l-[#5434EC]',
    bg: 'bg-[#FAF8FF]',
    iconBox: 'bg-[#F3EFFF] text-[#6847FF] border border-[#E4DFFF] group-hover:bg-[#6847FF] group-hover:text-white',
    badge: 'bg-[#F3EFFF] text-[#6847FF] border border-[#E4DFFF]',
    footerText: 'text-[#6847FF]',
    dotColor: 'bg-[#6847FF]',
  },
  // 2. Notes-Based Learning — Blue
  {
    borderLeft: 'border-l-[#399AF5] hover:border-l-[#2184E2]',
    bg: 'bg-[#F7FAFF]',
    iconBox: 'bg-[#EBF4FE] text-[#399AF5] border border-[#D1E6FD] group-hover:bg-[#399AF5] group-hover:text-white',
    badge: 'bg-[#EBF4FE] text-[#207EDC] border border-[#D1E6FD]',
    footerText: 'text-[#399AF5]',
    dotColor: 'bg-[#399AF5]',
  },
  // 3. Interactive Quizzes — Mint green
  {
    borderLeft: 'border-l-[#2BCB91] hover:border-l-[#1EAE7A]',
    bg: 'bg-[#F6FCF9]',
    iconBox: 'bg-[#E8F9F2] text-[#1FA85F] border border-[#C6F2DF] group-hover:bg-[#2BCB91] group-hover:text-white',
    badge: 'bg-[#E8F9F2] text-[#1FA85F] border border-[#C6F2DF]',
    footerText: 'text-[#2BCB91]',
    dotColor: 'bg-[#2BCB91]',
  },
  // 4. Structured Learning Paths — Indigo
  {
    borderLeft: 'border-l-[#6254D9] hover:border-l-[#4E41C4]',
    bg: 'bg-[#F9F8FE]',
    iconBox: 'bg-[#EDEAFC] text-[#6254D9] border border-[#DCD6FA] group-hover:bg-[#6254D9] group-hover:text-white',
    badge: 'bg-[#EDEAFC] text-[#6254D9] border border-[#DCD6FA]',
    footerText: 'text-[#6254D9]',
    dotColor: 'bg-[#6254D9]',
  },
  // 5. XP and Scholar Levels — Warm orange
  {
    borderLeft: 'border-l-[#FF994D] hover:border-l-[#E88235]',
    bg: 'bg-[#FFF9F5]',
    iconBox: 'bg-[#FFF0E5] text-[#E67324] border border-[#FFE0CC] group-hover:bg-[#FF994D] group-hover:text-white',
    badge: 'bg-[#FFF0E5] text-[#E06D1E] border border-[#FFE0CC]',
    footerText: 'text-[#FF994D]',
    dotColor: 'bg-[#FF994D]',
  },
  // 6. Streaks and Achievements — Pink
  {
    borderLeft: 'border-l-[#EB79BF] hover:border-l-[#D762AB]',
    bg: 'bg-[#FFF7FB]',
    iconBox: 'bg-[#FDEBF6] text-[#D84FA4] border border-[#F9D0EC] group-hover:bg-[#EB79BF] group-hover:text-white',
    badge: 'bg-[#FDEBF6] text-[#D84FA4] border border-[#F9D0EC]',
    footerText: 'text-[#EB79BF]',
    dotColor: 'bg-[#EB79BF]',
  },
  // 7. Learning Progress & Mastery — Cyan
  {
    borderLeft: 'border-l-[#24B8DE] hover:border-l-[#13A3C8]',
    bg: 'bg-[#F5FBFE]',
    iconBox: 'bg-[#E5F7FC] text-[#119BBF] border border-[#CEEEF8] group-hover:bg-[#24B8DE] group-hover:text-white',
    badge: 'bg-[#E5F7FC] text-[#119BBF] border border-[#CEEEF8]',
    footerText: 'text-[#24B8DE]',
    dotColor: 'bg-[#24B8DE]',
  },
  // 8. Community Leaderboards — Golden yellow
  {
    borderLeft: 'border-l-[#F5B82E] hover:border-l-[#DE9F17]',
    bg: 'bg-[#FFFCF4]',
    iconBox: 'bg-[#FEF6E4] text-[#D4930A] border border-[#FDEAC0] group-hover:bg-[#F5B82E] group-hover:text-white',
    badge: 'bg-[#FEF6E4] text-[#D4930A] border border-[#FDEAC0]',
    footerText: 'text-[#D4930A]',
    dotColor: 'bg-[#F5B82E]',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 md:py-28 bg-white border-t border-[#E4DFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E4DFFF]">
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            Engineered for genuine academic growth
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#77738D]">
            Every feature in Lernaut is intentionally crafted to bridge the gap between reading course materials and building durable recall.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_FEATURES.map((feat, idx) => {
            const Icon: any = ICON_MAP[feat.iconName] || Sparkles;
            const style = FEATURE_STYLES[idx % FEATURE_STYLES.length];
            return (
              <div
                key={feat.id}
                className={`rounded-2xl p-6 border-t border-r border-b border-[#E4DFFF] border-l-4 shadow-[0_2px_8px_rgba(37,32,70,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5 ${style.bg} ${style.borderLeft}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${style.iconBox}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {feat.badge && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${style.badge}`}>
                        {feat.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#24213A] mb-2 group-hover:text-[#252046] transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[#77738D] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className={`mt-5 pt-3 border-t border-[#E4DFFF]/60 flex items-center justify-between text-[11px] font-bold ${style.footerText}`}>
                  <span>Active Feature</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;
