"use client";

import React from 'react';
import { BRAND_CONFIG, FOUNDERS } from '../../data/landingData';
import { Users, HeartHandshake } from 'lucide-react';

export const AboutUsSection: React.FC = () => {
  return (
    <section id="about-us" className="py-20 md:py-28 bg-[#F8F6FF] border-t border-[#E4DFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E4DFFF]">
            <Users className="w-3.5 h-3.5" />
            <span>Our Mission & Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            {BRAND_CONFIG.aboutUsHeadline}
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#77738D] leading-relaxed">
            {BRAND_CONFIG.aboutUsDescription}
          </p>
        </div>

        {/* Real Founders Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {FOUNDERS.map((founder) => (
            <div
              key={founder.name}
              className="bg-white rounded-3xl p-8 border-2 border-[#E4DFFF] hover:border-[#6847FF]/50 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Initials-based clean avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6847FF] to-[#8F75FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#6847FF]/25 border-2 border-white">
                    {founder.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#24213A]">
                      {founder.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6847FF] mt-0.5">
                      {founder.role}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#77738D] leading-relaxed">
                  {founder.bio}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E4DFFF] flex items-center justify-between text-xs font-bold text-[#77738D]">
                <span className="flex items-center gap-1 text-[#6847FF]">
                  <HeartHandshake className="w-4 h-4" /> Founding Team
                </span>
                <span>Lernaut Platform</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AboutUsSection;
