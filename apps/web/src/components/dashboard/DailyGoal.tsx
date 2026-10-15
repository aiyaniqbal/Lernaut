import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { getProgressSnapshot, ProgressSnapshot } from '../../app/actions/progression';
import { getUserIdSync } from '../../hooks/useUserId';

const DailyGoalComponent: React.FC = () => {
  const [currentXP, setCurrentXP] = useState(0);
  const [goalXP, setGoalXP] = useState(100);
  const [currentLevel, setCurrentLevel] = useState(1);

  const fetchXp = useCallback(async () => {
    const uid = getUserIdSync();
    if (!uid) return;
    try {
      const snapshot = await getProgressSnapshot(uid);
      if (snapshot) {
        setCurrentXP(snapshot.xpIntoCurrentLevel);
        setGoalXP(snapshot.nextLevelXPRequired);
        setCurrentLevel(snapshot.currentLevel);
      }
    } catch (err) {
      console.warn('Could not fetch progression snapshot for daily goal:', err);
    }
  }, []);

  useEffect(() => {
    fetchXp();

    const handleUpdate = (e: any) => {
      const snap: ProgressSnapshot | undefined = e?.detail?.snapshot;
      if (snap) {
        setCurrentXP(snap.xpIntoCurrentLevel);
        setGoalXP(snap.nextLevelXPRequired);
        setCurrentLevel(snap.currentLevel);
        return;
      }
      fetchXp();
    };

    window.addEventListener('lernaut:xp-updated', handleUpdate);
    window.addEventListener('focus', fetchXp);

    // Refresh every 30 seconds as background fallback
    const interval = setInterval(fetchXp, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('lernaut:xp-updated', handleUpdate);
      window.removeEventListener('focus', fetchXp);
    };
  }, [fetchXp]);

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

export const DailyGoal = React.memo(DailyGoalComponent);
