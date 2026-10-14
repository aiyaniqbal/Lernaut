"use client";

import React, { useState } from 'react';
import {
  UploadCloud,
  Sparkles,
  FileQuestion,
  Target,
  ArrowRightCircle,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Zap,
  Database,
} from 'lucide-react';
import { PIPELINE_STEPS } from '../../data/landingData';

const STEP_ICONS: Record<string, React.ElementType<any>> = {
  UploadCloud,
  Sparkles,
  FileQuestion,
  Target,
  ArrowRightCircle,
  TrendingUp,
};

export const ShowcaseSection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(1);

  const previewDetails = [
    {
      title: '1. Bring Your Raw Study Materials',
      badge: 'Grounded RAG Ingestion',
      content: 'Drop textbook chapters, syllabus guides, or lecture PDF notes. Lernaut parses the content securely and indexes core concepts without hallucination.',
      sampleSnippet: 'Uploaded: "Biology_Chapter_4_Cell_Metabolism.pdf" (24 pages, 18 concepts identified)',
    },
    {
      title: '2. Interactive AI Explanation Segment',
      badge: 'Multilingual Voice & Text',
      content: 'The AI teacher breaks complex paragraphs into digestible concepts with real-time analogies and diagrams, speaking English, Hindi, or Hinglish.',
      sampleSnippet: '"Think of the mitochondria as the factory generator: glucose comes in, ATP power packets go out!"',
    },
    {
      title: '3. Instant Recall Checkpoint',
      badge: 'Active Recall',
      content: 'After each concept, a mini quick-check ensures you understand before moving forward, eliminating passive nodding.',
      sampleSnippet: 'Q: What substrate enters the Krebs cycle? [Option A: Pyruvate ✓] (+15 XP)',
    },
    {
      title: '4. Precision Gap Identification',
      badge: 'Cognitive Diagnosis',
      content: 'If an error occurs, the engine diagnoses the exact misconception rather than just marking you wrong.',
      sampleSnippet: 'Diagnosed: Confusion between aerobic glycolysis and anaerobic fermentation.',
    },
    {
      title: '5. Dynamic Revision Drill',
      badge: 'Targeted Remediation',
      content: 'Your study queue automatically inserts a 3-minute targeted drill to cement the weak topic before exam day.',
      sampleSnippet: 'Drill Added: "Anaerobic Byproducts & Lactic Acid Breakdown — Quick Refresh"',
    },
    {
      title: '6. Tangible Progress & Habit Loop',
      badge: 'Verified Progression',
      content: 'All activity records to your persistent profile, advancing your roadmap nodes, scholar tier, and weekly leaderboard standings.',
      sampleSnippet: 'Progression: +50 XP, Streak Day 7 Maintained, "First Spark" Badge Unlocked!',
    },
  ];

  const currentStep = previewDetails[activeStepIndex];

  return (
    <section className="py-20 md:py-28 bg-[#F8F6FF] border-t border-[#E4DFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider mb-3 border border-[#E4DFFF]">
            <span>End-to-End Learning Loop</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-fredoka text-[#24213A] tracking-tight">
            From your notes to real understanding.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#77738D]">
            Explore how Lernaut connects uploaded study material with intelligent teaching, rapid practice, and visible progress.
          </p>
        </div>

        {/* Pipeline Navigation Bar */}
        <div className="bg-white rounded-2xl p-3 border-2 border-[#E4DFFF] shadow-sm mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {PIPELINE_STEPS.map((item, idx) => {
              const Icon: any = STEP_ICONS[item.icon] || Sparkles;
              const isActive = activeStepIndex === idx;
              return (
                <React.Fragment key={item.step}>
                  <button
                    onClick={() => setActiveStepIndex(idx)}
                    className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#6847FF] text-white shadow-md shadow-[#6847FF]/25'
                        : 'bg-[#F8F6FF] text-[#24213A] hover:bg-[#F3EFFF]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#77738D]/40 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Interactive Step Preview Stage */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#E4DFFF] shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="px-3 py-1 rounded-full bg-[#F3EFFF] text-[#6847FF] text-xs font-bold uppercase tracking-wider border border-[#E4DFFF]">
              {currentStep.badge}
            </span>
            <h3 className="text-2xl font-black font-fredoka text-[#24213A] mt-4 mb-3">
              {currentStep.title}
            </h3>
            <p className="text-sm text-[#77738D] leading-relaxed mb-6">
              {currentStep.content}
            </p>

            <div className="bg-[#F8F6FF] rounded-2xl p-4 border border-[#E4DFFF]">
              <div className="text-[11px] font-bold text-[#6847FF] uppercase tracking-wide mb-1">
                Live Simulation Output
              </div>
              <div className="text-xs font-mono font-bold text-[#24213A] bg-white p-3 rounded-xl border border-[#E4DFFF]">
                {currentStep.sampleSnippet}
              </div>
            </div>
          </div>

          {/* Engine Telemetry & Guarantees Card */}
          <div 
            className="lg:col-span-5 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/25 transition-all duration-300"
            style={{
              background: `
                radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.25), transparent 45%),
                radial-gradient(circle at 10% 90%, rgba(243, 239, 255, 0.20), transparent 50%),
                linear-gradient(135deg, #6847FF 0%, #7653FF 50%, #8F75FF 100%)
              `,
              boxShadow: '0 20px 45px rgba(104, 71, 255, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.40)',
            }}
          >
            {/* Ambient subtle light glows */}
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#E8D2FF]/25 blur-2xl pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

            {/* Header: Status & Engine Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/20 relative z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ED47A] opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2ED47A]"></span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide drop-shadow-sm">
                  Grounded Intelligence
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
                Lernaut Engine
              </span>
            </div>

            {/* Checklist / Guarantees as Modern Frosted Micro-Cards */}
            <div className="mt-4 space-y-2.5 relative z-10">
              {/* Item 1 */}
              <div className="bg-white/12 hover:bg-white/20 border border-white/25 hover:border-white/40 rounded-xl p-3 flex items-start gap-3 transition-all duration-200 group backdrop-blur-md">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-400/20 border border-emerald-300/40 text-[#2ED47A] flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-[#2ED47A] group-hover:text-white transition-all">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="text-xs leading-snug">
                  <div className="font-extrabold text-white">
                    Zero Hallucinations
                  </div>
                  <div className="text-white/85 font-medium mt-0.5">
                    Strict textbook & raw note grounding
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-white/12 hover:bg-white/20 border border-white/25 hover:border-white/40 rounded-xl p-3 flex items-start gap-3 transition-all duration-200 group backdrop-blur-md">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-400/20 border border-amber-300/40 text-[#FFC93C] flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-[#FFC93C] group-hover:text-[#252046] transition-all">
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="text-xs leading-snug">
                  <div className="font-extrabold text-white">
                    Adaptive Pacing
                  </div>
                  <div className="text-white/85 font-medium mt-0.5">
                    Dynamic pace calibrated by quiz responses
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-white/12 hover:bg-white/20 border border-white/25 hover:border-white/40 rounded-xl p-3 flex items-start gap-3 transition-all duration-200 group backdrop-blur-md">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-400/20 border border-sky-300/40 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-[#38BDF8] group-hover:text-white transition-all">
                  <Database className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="text-xs leading-snug">
                  <div className="font-extrabold text-white">
                    Persistent Progression
                  </div>
                  <div className="text-white/85 font-medium mt-0.5">
                    Synchronized live with database & XP tier
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Interactive Hint */}
            <div className="mt-4 pt-3.5 border-t border-white/20 text-center relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC93C] shrink-0" />
                <span>Click any step above to inspect the pipeline flow</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ShowcaseSection;
