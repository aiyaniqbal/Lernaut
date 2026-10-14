import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  PlayCircle,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import { Roadmap, RoadmapStep } from '../../types';

interface RoadmapViewProps {
  roadmap: Roadmap;
  onSelectStep: (step: RoadmapStep) => void;
  onRegenerateRoadmap: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  onSelectStep,
  onRegenerateRoadmap,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>(
    roadmap.steps.find((s) => s.status === 'in_progress')?.id || roadmap.steps[0].id
  );

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onRegenerateRoadmap();
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[24px] border-[3px] border-ink p-6 sm:p-8 transition-transform"
        style={{ boxShadow: '6px 6px 0px 0px #FFC93C' }}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/10 border-[2px] border-violet text-xs font-bold text-violet font-nunito">
            <Compass className="w-3.5 h-3.5" />
            AI Dynamic Curriculum
          </div>
          <h1 className="text-2xl sm:text-3xl font-fredoka font-black text-ink tracking-wide uppercase">
            Your Personalized Roadmap
          </h1>
          <p className="text-sm font-nunito font-bold text-ink/70">
            Lernaut builds your learning path based on your goals, knowledge, and performance.
          </p>
        </div>

        <button
          disabled={isGenerating}
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-ink font-fredoka font-bold text-sm tracking-wide uppercase border-[3px] border-ink transition-all active:translate-y-1 active:translate-x-1 shrink-0"
          style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}
          onMouseDown={(e) => {
            if(!isGenerating) {
              e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
              e.currentTarget.style.transform = 'translate(4px, 4px)';
            }
          }}
          onMouseUp={(e) => {
            if(!isGenerating) {
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
              e.currentTarget.style.transform = 'translate(0px, 0px)';
            }
          }}
          onMouseLeave={(e) => {
            if(!isGenerating) {
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
              e.currentTarget.style.transform = 'translate(0px, 0px)';
            }
          }}
        >
          <RefreshCw className={`w-4 h-4 text-violet ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Adapting...' : 'Generate New'}</span>
        </button>
      </div>

      {/* Adaptive Decision Banner */}
      <div 
        className="p-5 rounded-[20px] bg-violet text-white border-[3px] border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
        style={{ boxShadow: '6px 6px 0px 0px #1E1B3A' }}
      >
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white border-[3px] border-ink flex items-center justify-center shrink-0" style={{ boxShadow: '3px 3px 0px 0px #1E1B3A' }}>
            <Sparkles className="w-6 h-6 text-violet animate-pulse" />
          </div>
          <div className="text-sm">
            <p className="font-fredoka text-lg font-black tracking-wide uppercase">Dynamic Adaptation Active</p>
            <p className="font-nunito font-bold text-white/90 text-xs sm:text-sm mt-0.5">
              Module 3 expanded with extra numerical practice on Resistance & Branch Circuits based on your 72% quiz score.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 relative z-10">
          <span className="font-fredoka text-sm tracking-widest font-black bg-ink text-white px-4 py-2 rounded-xl border-[3px] border-ink shadow-[3px_3px_0px_0px_#FFC93C]">
            {roadmap.completedSteps} of {roadmap.totalSteps} DONE
          </span>
        </div>
      </div>

      {/* Main Roadmap Timeline / Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Nodes List (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {roadmap.steps.map((step, idx) => {
            const isSelected = selectedStepId === step.id;
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isLocked = step.status === 'locked';

            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`relative p-5 rounded-[20px] border-[3px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-ink z-10 scale-[1.02]'
                    : isCompleted
                    ? 'bg-white border-ink hover:-translate-y-1'
                    : isInProgress
                    ? 'bg-white border-ink hover:-translate-y-1'
                    : 'bg-cloud border-ink/30 opacity-70 hover:opacity-100 hover:-translate-y-1'
                }`}
                style={{
                  boxShadow: isSelected
                    ? '6px 6px 0px 0px #6C4DFF'
                    : isCompleted
                    ? '5px 5px 0px 0px #2ED47A'
                    : isInProgress
                    ? '5px 5px 0px 0px #FFC93C'
                    : '4px 4px 0px 0px rgba(30, 27, 58, 0.2)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-xl bg-mint text-white border-[3px] border-ink flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#1E1B3A]">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isInProgress ? (
                        <div className="w-10 h-10 rounded-xl bg-gold text-ink border-[3px] border-ink flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#1E1B3A] animate-pulse">
                          <PlayCircle className="w-5 h-5 fill-current" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-cloud text-ink/40 border-[3px] border-ink/40 flex items-center justify-center font-bold">
                          <Lock className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-fredoka text-sm font-black text-ink uppercase tracking-wider">
                          Step {step.number}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-mint text-ink border-[2px] border-ink uppercase">
                            ✓ Done
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold text-ink border-[2px] border-ink uppercase">
                            {step.progressPercent}% Active
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cloud text-ink/60 border-[2px] border-ink/30 uppercase">
                            Locked
                          </span>
                        )}
                      </div>

                      <h2 className={`font-nunito font-bold text-lg ${isLocked ? 'text-ink/60' : 'text-ink'}`}>
                        {step.title}
                      </h2>
                    </div>
                  </div>

                  <span className="font-fredoka text-xs font-black text-ink bg-white px-2 py-1 rounded-md border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] shrink-0">
                    ~{step.estimatedHours}h
                  </span>
                </div>

                {/* Progress bar for in-progress step */}
                {isInProgress && (
                  <div className="mt-4 w-full bg-cloud rounded-full h-3 border-[2px] border-ink overflow-hidden">
                    <div
                      className="bg-gold h-full border-r-[2px] border-ink"
                      style={{ width: `${step.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Detail Panel (5 cols) */}
        <div 
          className="lg:col-span-5 bg-[#F8F7FA] rounded-[24px] border-[3px] border-ink p-6 sm:p-8 space-y-6 self-start sticky top-24"
          style={{ boxShadow: '6px 6px 0px 0px #FFC93C' }}
        >
          {(() => {
            const currentStep = roadmap.steps.find((s) => s.id === selectedStepId) || roadmap.steps[0];
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[3px] border-ink pb-4">
                  <div>
                    <span className="font-fredoka text-sm font-black text-violet uppercase tracking-wide">
                      Step {currentStep.number} Detail
                    </span>
                    <h2 className="font-nunito font-extrabold text-2xl text-ink mt-1">
                      {currentStep.title}
                    </h2>
                  </div>
                </div>

                <p className="font-nunito font-bold text-sm text-ink/80 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Subtopics Checklist */}
                <div className="space-y-3">
                  <span className="font-fredoka text-xs font-black text-ink uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    Core Concepts in this Module
                  </span>
                  <div className="space-y-2">
                    {currentStep.subtopics.map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border-[2px] border-ink text-sm font-nunito font-bold text-ink transition-transform hover:-translate-y-0.5 group"
                        style={{ boxShadow: '2px 2px 0px 0px #1E1B3A' }}
                      >
                        <div className="w-6 h-6 rounded-md bg-violet text-white border-2 border-ink flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4">
                  <button
                    onClick={() => onSelectStep(currentStep)}
                    className="w-full py-4 rounded-xl bg-berry text-white font-fredoka font-black text-lg uppercase tracking-wide border-[3px] border-ink transition-all flex items-center justify-center gap-2 active:translate-y-1 active:translate-x-1"
                    style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                      e.currentTarget.style.transform = 'translate(4px, 4px)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                      e.currentTarget.style.transform = 'translate(0px, 0px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                      e.currentTarget.style.transform = 'translate(0px, 0px)';
                    }}
                  >
                    <span>Launch AI Teacher</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
