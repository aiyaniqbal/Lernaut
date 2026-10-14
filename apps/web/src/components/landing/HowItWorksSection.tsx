"use client";

import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../../data/landingData';
import { UploadCloud, Sparkles, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';

const STEP_ICONS = [UploadCloud, Sparkles, CheckCircle2, TrendingUp];

interface StepColorStyle {
  borderLeft: string;
  bg: string;
  numberColor: string;
  subtitleColor: string;
  iconBox: string;
  footerText: string;
}

const STEP_STYLES: StepColorStyle[] = [
  // Card 01 — Purple
  {
    borderLeft: 'border-l-[#6847FF] hover:border-l-[#5434EC]',
    bg: 'bg-[#FAF8FF]',
    numberColor: 'text-[#6847FF]',
    subtitleColor: 'text-[#6847FF]',
    iconBox: 'bg-[#F3EFFF] text-[#6847FF] border border-[#E4DFFF] group-hover:bg-[#6847FF] group-hover:text-white',
    footerText: 'text-[#6847FF]',
  },
  // Card 02 — Blue
  {
    borderLeft: 'border-l-[#399AF5] hover:border-l-[#2184E2]',
    bg: 'bg-[#F7FAFF]',
    numberColor: 'text-[#399AF5]',
    subtitleColor: 'text-[#207EDC]',
    iconBox: 'bg-[#EBF4FE] text-[#399AF5] border border-[#D1E6FD] group-hover:bg-[#399AF5] group-hover:text-white',
    footerText: 'text-[#399AF5]',
  },
  // Card 03 — Mint green
  {
    borderLeft: 'border-l-[#2BCB91] hover:border-l-[#1EAE7A]',
    bg: 'bg-[#F6FCF9]',
    numberColor: 'text-[#2BCB91]',
    subtitleColor: 'text-[#1B9B60]',
    iconBox: 'bg-[#E8F9F2] text-[#1FA85F] border border-[#C6F2DF] group-hover:bg-[#2BCB91] group-hover:text-white',
    footerText: 'text-[#2BCB91]',
  },
  // Card 04 — Warm orange
  {
    borderLeft: 'border-l-[#FF994D] hover:border-l-[#E88235]',
    bg: 'bg-[#FFF9F5]',
    numberColor: 'text-[#FF994D]',
    subtitleColor: 'text-[#E06D1E]',
    iconBox: 'bg-[#FFF0E5] text-[#E67324] border border-[#FFE0CC] group-hover:bg-[#FF994D] group-hover:text-white',
    footerText: 'text-[#FF994D]',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#F8F6FF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E4DFFF]">
            <span>Workflow Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            How Lernaut Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#77738D]">
            A seamless, science-backed four-step cycle from your raw textbooks to proven exam confidence.
          </p>
        </div>

        {/* 4 Connected Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[idx % STEP_ICONS.length];
            const style = STEP_STYLES[idx % STEP_STYLES.length];
            return (
              <div
                key={step.step}
                className={`rounded-2xl p-6 border-t border-r border-b border-[#E4DFFF] border-l-4 shadow-[0_2px_8px_rgba(37,32,70,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative hover:-translate-y-0.5 ${style.bg} ${style.borderLeft}`}
              >
                {/* Step Content */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-2xl font-black font-fredoka ${style.numberColor}`}>
                      {step.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${style.iconBox}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#24213A] mb-2 group-hover:text-[#252046] transition-colors">
                    {step.title}
                  </h3>

                  <p className={`text-xs font-semibold mb-2 leading-relaxed ${style.subtitleColor}`}>
                    {step.description}
                  </p>

                  <p className="text-xs text-[#77738D] leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                <div className={`mt-6 pt-4 border-t border-[#E4DFFF]/80 flex items-center text-xs font-bold transition-colors ${style.footerText}`}>
                  <span>Step {idx + 1} of 4</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default HowItWorksSection;
