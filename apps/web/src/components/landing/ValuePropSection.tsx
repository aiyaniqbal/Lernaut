"use client";

import React from 'react';
import { VALUE_PILLARS } from '../../data/landingData';
import { Check, X, Sparkles } from 'lucide-react';

export const ValuePropSection: React.FC = () => {
  return (
    <section className="py-20 bg-white border-y border-[#E4DFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Lernaut Philosophy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            Studying should feel like progress, not pressure.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#77738D] leading-relaxed">
            Most students get overwhelmed because notes, lectures, and test prep live in disconnected silos. Lernaut bridges your materials into an intuitive loop where reading becomes understanding, and understanding turns into measurable mastery.
          </p>
        </div>

        {/* 3 Value Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUE_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-[#F8F6FF] rounded-2xl p-6 border border-[#E4DFFF] hover:border-[#6847FF]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-[#24213A] mb-4 pb-3 border-b border-[#E4DFFF]">
                  {pillar.title}
                </h3>

                {/* The Old Way */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-wider mb-1.5">
                    <X className="w-3.5 h-3.5" /> Conventional Study
                  </div>
                  <p className="text-xs text-[#77738D] leading-relaxed">
                    {pillar.before}
                  </p>
                </div>

                {/* The Lernaut Way */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2ED47A] uppercase tracking-wider mb-1.5">
                    <Check className="w-3.5 h-3.5" /> The Lernaut Approach
                  </div>
                  <p className="text-xs text-[#24213A] font-semibold leading-relaxed">
                    {pillar.after}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E4DFFF] flex items-center justify-between text-[11px] font-bold text-[#6847FF]">
                <span>Phase 0{idx + 1} Pillar</span>
                <span>Active Learning</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ValuePropSection;
