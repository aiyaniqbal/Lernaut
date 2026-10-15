import React from 'react';
import {
  Play,
  Flame,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Upload,
  Layers,
  FileQuestion,
  FileText,
  Network,
  Compass,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { StudentProfile, PageId, QuizResult } from '../../types';

interface DashboardProps {
  student: StudentProfile;
  recentQuiz: QuizResult;
  onNavigate: (page: PageId) => void;
  onStartWeakPractice: (concept: string) => void;
  onOpenSummaryModal: () => void;
}

import { StreakWeek } from './StreakWeek';
import { DailyGoal } from './DailyGoal';
import { LessonPath } from './LessonPath';
import { TaskManager } from './TaskManager';

const DashboardComponent: React.FC<DashboardProps> = ({
  student,
  recentQuiz,
  onNavigate,
  onStartWeakPractice,
  onOpenSummaryModal,
}) => {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-violet text-white border-[3px] border-ink rounded-[24px] p-8 sm:p-10 shadow-[6px_6px_0px_0px_#1E1B3A] relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border-[2px] border-white/50 text-xs font-nunito font-bold text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
            <Sparkles className="w-4 h-4 text-gold fill-gold" />
            AI Adaptive Learning Mode Active
          </div>
          <h1 className="text-3xl sm:text-5xl font-fredoka font-black tracking-wide text-white drop-shadow-[2px_2px_0px_#1E1B3A] uppercase">
            Good afternoon, {student.name.split(' ')[0]}
          </h1>
          <p className="text-sm font-nunito font-bold text-white/90 max-w-lg">
            Ready to continue learning? Your Lernaut AI Teacher is ready to pick up where you left off.
          </p>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mt-6 md:mt-0">
          <div>
            <div className="uiverse-pixel-card transform rotate-2 hover:rotate-0 transition-all origin-bottom-right">
              <div className="uiverse-card-header">
                DAILY MISSION
              </div>
              <div className="uiverse-card-body">
                <p>Objective: Complete Lesson</p>
                <p>Condition: Focus Mode Active</p>
                <p>Status: <span className="status">READY</span></p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('learn')}
            className="btn-playful"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Backpack */}
              <path d="M19 9V16C19 16.6 18.6 17 18 17H16V8H18C18.6 8 19 8.4 19 9Z" fill="#E11D48" stroke="#1E1B3A" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Body */}
              <path d="M16 19C16 20.1 15.1 21 14 21H12C11.4 21 11 20.6 11 20V18H9V20C9 20.6 8.6 21 8 21H6C4.9 21 4 20.1 4 19V11C4 7.7 6.7 5 10 5H12C14.2 5 16 6.8 16 9V19Z" fill="#E11D48" stroke="#1E1B3A" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Visor */}
              <path d="M12 9H3C2.4 9 2 9.4 2 10V12C2 13.1 2.9 14 4 14H12C13.1 14 14 13.1 14 12V10C14 9.4 13.6 9 13 9Z" fill="#38BDF8" stroke="#1E1B3A" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Visor Highlight */}
              <path d="M4 10.5H8" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="now-text">NOW</span>
            <span className="play-text">LEARN</span>
          </button>
        </div>
      </div>
      </div>

      {/* Gamified Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StreakWeek />
        <DailyGoal />
        <TaskManager />
      </div>

      {/* Top 3 Core Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. CURRENT SESSION */}
        <div className="group cursor-pointer bg-white border-[3px] border-ink rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B3A] overflow-hidden hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#6C4DFF] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col" onClick={() => onNavigate('learn')}>
          <div className="bg-violet/10 border-b-[3px] border-ink p-6 flex flex-col items-center justify-center relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-violet/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="w-16 h-16 rounded-[16px] bg-violet flex items-center justify-center shadow-[4px_4px_0px_0px_#1E1B3A] border-[3px] border-ink mb-3 z-10 group-hover:scale-110 transition-transform">
                 <Play className="w-8 h-8 text-white fill-white ml-1" />
             </div>
             <div className="font-fredoka font-black text-violet text-lg z-10 uppercase tracking-wide">Resume Session</div>
          </div>
          <div className="p-5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-fredoka font-black text-ink text-[1.1rem]">Physics — Electricity</div>
              <ArrowRight className="w-5 h-5 text-ink/60 group-hover:text-violet transition-colors" />
            </div>
            <p className="text-sm font-nunito font-bold text-ink/70">Ohm's Law & Circuit Dynamics</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-violet text-white border-[2px] border-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">Lesson 2 of 6</span>
              <span className="px-2 py-1 rounded bg-white border-[2px] border-violet text-violet text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">68% Complete</span>
            </div>
          </div>
        </div>

        {/* 2. WEAK AREA */}
        <div className="group cursor-pointer bg-white border-[3px] border-ink rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B3A] overflow-hidden hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#FF6B35] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col" onClick={() => onStartWeakPractice("Ohm's Law")}>
          <div className="bg-flame/10 border-b-[3px] border-ink p-6 flex flex-col items-center justify-center relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-flame/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="w-16 h-16 rounded-[16px] bg-flame flex items-center justify-center shadow-[4px_4px_0px_0px_#1E1B3A] border-[3px] border-ink mb-3 z-10 group-hover:scale-110 transition-transform">
                 <AlertTriangle className="w-8 h-8 text-white" />
             </div>
             <div className="font-fredoka font-black text-flame text-lg z-10 uppercase tracking-wide">Weak Area Detected</div>
          </div>
          <div className="p-5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-fredoka font-black text-ink text-[1.1rem]">Ohm's Law</div>
              <ArrowRight className="w-5 h-5 text-ink/60 group-hover:text-flame transition-colors" />
            </div>
            <p className="text-sm font-nunito font-bold text-ink/70">Struggling with inverse proportions</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-flame text-white border-[2px] border-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">48% Accuracy</span>
              <span className="px-2 py-1 rounded bg-white border-[2px] border-flame text-flame text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">Practice Now</span>
            </div>
          </div>
        </div>

        {/* 3. RECOMMENDED */}
        <div className="group cursor-pointer bg-white border-[3px] border-ink rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B3A] overflow-hidden hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#2ED47A] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col" onClick={() => onNavigate('learn')}>
          <div className="bg-mint/10 border-b-[3px] border-ink p-6 flex flex-col items-center justify-center relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-mint/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="w-16 h-16 rounded-[16px] bg-mint flex items-center justify-center shadow-[4px_4px_0px_0px_#1E1B3A] border-[3px] border-ink mb-3 z-10 group-hover:scale-110 transition-transform">
                 <BookOpen className="w-8 h-8 text-ink" />
             </div>
             <div className="font-fredoka font-black text-ink text-lg z-10 uppercase tracking-wide">Recommended Next</div>
          </div>
          <div className="p-5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-fredoka font-black text-ink text-[1.1rem]">Resistance & Circuits</div>
              <ArrowRight className="w-5 h-5 text-ink/60 group-hover:text-mint transition-colors" />
            </div>
            <p className="text-sm font-nunito font-bold text-ink/70">Adaptive 15-min lesson</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-mint border-[2px] border-ink text-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">+50 XP</span>
              <span className="px-2 py-1 rounded bg-white border-[2px] border-mint text-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">Interactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] flex items-center gap-4 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-flame/10 border-[2px] border-flame flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <Flame className="w-6 h-6 text-flame fill-flame" />
          </div>
          <div>
            <p className="text-xs font-nunito font-bold text-ink/60 uppercase tracking-wider">Study Streak</p>
            <p className="text-2xl font-fredoka font-black text-ink">{student.streakDays} Days</p>
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] flex items-center gap-4 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-blue-500/10 border-[2px] border-blue-500 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <Award className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-nunito font-bold text-ink/60 uppercase tracking-wider">Recent Score</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-fredoka font-black text-ink">{recentQuiz.scorePercent}%</span>
              <span className="text-xs font-nunito font-bold text-ink/60">({recentQuiz.correctCount}/{recentQuiz.totalQuestions})</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] flex items-center gap-4 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-mint/10 border-[2px] border-mint flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <TrendingUp className="w-6 h-6 text-mint" />
          </div>
          <div>
            <p className="text-xs font-nunito font-bold text-ink/60 uppercase tracking-wider">Mastered</p>
            <p className="text-2xl font-fredoka font-black text-ink">{student.topicsStudiedCount} Topics</p>
          </div>
        </div>

        <div className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] flex items-center gap-4 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-purple-500/10 border-[2px] border-purple-500 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-nunito font-bold text-ink/60 uppercase tracking-wider">Study Time</p>
            <p className="text-2xl font-fredoka font-black text-ink">{student.totalStudyHours} Hours</p>
          </div>
        </div>
      </div>

      <LessonPath />

      {/* QUICK ACTIONS SECTION */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-fredoka font-black text-ink uppercase tracking-wide">Quick Actions</h2>
          <p className="text-sm font-nunito font-bold text-ink/60">Instantly launch an AI-powered learning tool</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <button onClick={() => onNavigate('materials')} className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col items-center text-center gap-4 group">
            <div className="w-14 h-14 rounded-[16px] bg-violet/10 text-violet flex items-center justify-center group-hover:-rotate-12 transition-all border-[3px] border-violet shadow-[2px_2px_0px_0px_#6C4DFF]">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">Upload Material</span>
          </button>

          <button onClick={() => onNavigate('learn')} className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col items-center text-center gap-4 group">
            <div className="w-14 h-14 rounded-[16px] bg-violet text-ink flex items-center justify-center group-hover:-rotate-12 transition-all border-[3px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]">
              <Play className="w-7 h-7 fill-white text-white" />
            </div>
            <span className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">Start Teacher</span>
          </button>

          <button onClick={() => onNavigate('quiz')} className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col items-center text-center gap-4 group">
            <div className="w-14 h-14 rounded-[16px] bg-gold/10 text-flame flex items-center justify-center group-hover:-rotate-12 transition-all border-[3px] border-gold shadow-[2px_2px_0px_0px_#FFC93C]">
              <FileQuestion className="w-7 h-7" />
            </div>
            <span className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">Generate Quiz</span>
          </button>

          <button onClick={onOpenSummaryModal} className="p-5 rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex flex-col items-center text-center gap-4 group">
            <div className="w-14 h-14 rounded-[16px] bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:-rotate-12 transition-all border-[3px] border-sky-500 shadow-[2px_2px_0px_0px_#38BDF8]">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">Summarize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardComponent);
