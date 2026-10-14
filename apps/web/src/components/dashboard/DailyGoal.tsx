import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { getProfile } from '../../app/actions/xp';
import { getLevelInfo } from '../../utils/xpUtils';
import { getUserIdSync } from '../../hooks/useUserId';

export const DailyGoal: React.FC = () => {
  const [currentXP, setCurrentXP] = useState(0);
  const [goalXP, setGoalXP] = useState(100);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    // Fetch initial XP on mount and set up polling for live updates
    const fetchXp = async () => {
      const uid = getUserIdSync();
      const profile = await getProfile(uid || undefined);
      if (profile) {
        const { level, xpIntoCurrentLevel, nextLevelXPRequired } = getLevelInfo(profile.totalXP);
        setCurrentXP(xpIntoCurrentLevel);
        setGoalXP(nextLevelXPRequired);
        setCurrentLevel(level);
      }
    };
    fetchXp();
    
    // Poll every 2 seconds for live updates from task manager
    const interval = setInterval(fetchXp, 2000);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min((currentXP / goalXP) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-[24px] border-[3px] border-ink p-6 space-y-5 shadow-[4px_4px_0px_0px_#1E1B3A]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gold/10 rounded-xl border-[2px] border-gold shadow-[2px_2px_0px_0px_#1E1B3A]">
            <Zap className="w-5 h-5 text-gold fill-gold" />
          </div>
          <h2 className="text-sm font-fredoka font-black text-ink uppercase tracking-wider">Daily Goal</h2>
        </div>
        <div className="px-3 py-1 bg-violet border-[2px] border-ink text-white rounded-full text-xs font-fredoka font-black tracking-widest shadow-[2px_2px_0px_0px_#1E1B3A]">
          LEVEL {currentLevel}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <div className="relative w-32 h-32 flex items-center justify-center bg-cloud rounded-full border-[4px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A]">
          <svg viewBox="0 0 128 128" className="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#E3DEFA"
              strokeWidth="16"
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#2ED47A"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center font-fredoka font-black z-10">
            <span className="text-3xl text-ink tracking-tight">{currentXP}<span className="text-sm text-ink/50 ml-0.5">/{goalXP}</span></span>
          </div>
        </div>
        <p className="text-xs font-nunito font-bold text-ink uppercase tracking-wider mt-2">Earn XP to Level Up!</p>
      </div>
    </div>
  );
};
