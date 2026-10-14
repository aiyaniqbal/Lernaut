"use client";

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface CtaSectionProps {
  onNavigateToApp?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onNavigateToApp }) => {
  const { isAuthenticated } = useAuth();

  const handleAction = () => {
    if (isAuthenticated && onNavigateToApp) {
      onNavigateToApp();
    } else {
      window.location.hash = '#/signup';
    }
  };

  return (
    <section 
      className="py-20 md:py-28 relative overflow-hidden text-white"
      style={{
        background: `
          radial-gradient(ellipse at 15% 25%, rgba(142, 112, 255, 0.40), transparent 50%),
          radial-gradient(ellipse at 85% 75%, rgba(232, 210, 255, 0.28), transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(104, 71, 255, 0.35), transparent 60%),
          linear-gradient(125deg, #30206F 0%, #5333D7 35%, #6847FF 65%, #3C2782 100%)
        `,
      }}
    >
      {/* Subtle Luminous Ambient Light Glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#8E70FF]/25 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-12 w-96 h-96 rounded-full bg-[#E8D2FF]/20 blur-[90px] pointer-events-none" />

      {/* Decorative Subtle Orbital Arc (Learning-Universe Motif) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 400"
      >
        <path
          d="M-100,320 Q300,40 700,180 T1300,120"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <circle cx="700" cy="180" r="3" fill="white" />
        <circle cx="300" cy="80" r="2" fill="white" />
        <circle cx="950" cy="140" r="2.5" fill="white" />
      </svg>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Inner Translucent Lavender-White Card */}
        <div 
          className="rounded-3xl p-8 sm:p-10 md:py-12 md:px-12 text-center border transition-all duration-300 relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.10)',
            borderColor: 'rgba(255, 255, 255, 0.22)',
            boxShadow: '0 20px 50px rgba(25, 16, 65, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Top highlight line for subtle depth */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* 1. Small Introductory Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.12] border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] text-xs font-bold uppercase tracking-wider mb-6 text-white backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC93C]" />
            <span>Transform Your Study Sessions</span>
          </div>

          {/* 2. Main Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black font-fredoka tracking-tight leading-tight text-white drop-shadow-[0_2px_10px_rgba(20,12,50,0.3)] text-balance md:whitespace-nowrap">
            Make your next study session count.
          </h2>

          {/* 3. Supporting Sentence */}
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#F3EFFF]/90 max-w-3xl mx-auto leading-relaxed font-medium text-balance md:whitespace-nowrap">
            Bring your materials, start a lesson, and build a learning routine that works for you.
          </p>

          {/* 4. Two CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary Button */}
            <button
              onClick={handleAction}
              className="w-full sm:w-auto pl-6 sm:pl-7 pr-2.5 sm:pr-3 py-2.5 sm:py-3 min-h-[48px] sm:min-h-[52px] bg-white hover:bg-[#F3EFFF] text-[#252046] font-extrabold text-base rounded-2xl shadow-[0_8px_24px_rgba(37,32,70,0.25),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_12px_32px_rgba(37,32,70,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 group cursor-pointer"
            >
              <span>{isAuthenticated ? 'Go to Your Dashboard' : 'Create Your Account'}</span>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6847FF] group-hover:bg-[#5835F5] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(104,71,255,0.35)] group-hover:scale-105 transition-all duration-200 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
              </span>
            </button>

            {/* Secondary Button */}
            {!isAuthenticated && (
              <a
                href="#/login"
                className="w-full sm:w-auto px-6 sm:px-7 py-2.5 sm:py-3 min-h-[48px] sm:min-h-[52px] bg-white/12 hover:bg-white/20 text-white font-bold text-base rounded-2xl border border-white/25 hover:border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 backdrop-blur-md transition-all duration-200 text-center cursor-pointer flex items-center justify-center"
              >
                Sign in to Existing Account
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Gentle Bottom Transition Edge to About Section */}
      <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-b from-transparent to-[#F8F6FF]/10 pointer-events-none" />
    </section>
  );
};
export default CtaSection;
