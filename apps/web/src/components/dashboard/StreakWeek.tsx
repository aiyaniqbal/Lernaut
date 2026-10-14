import React, { useEffect, useState } from 'react';
import { getUserIdSync } from '../../hooks/useUserId';

interface DayState {
  label: string;
  id: number;   // 0=Mon ... 6=Sun
  today: boolean;
  active: boolean; // qualifying activity recorded
}

/**
 * Fetches the last 7 days of daily activity for the current user.
 * Falls back to empty (no activity) for a brand new user.
 */
async function fetchWeekActivity(): Promise<Set<string>> {
  const userId = getUserIdSync();
  if (!userId) return new Set();

  try {
    const resp = await fetch(`/api/activity-week?userId=${encodeURIComponent(userId)}`);
    if (!resp.ok) return new Set();
    const dates: string[] = await resp.json();
    return new Set(dates);
  } catch {
    return new Set();
  }
}

export const StreakWeek: React.FC = () => {
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWeekActivity().then(setActiveDates);
    // Refresh every 30 s so completing a lesson updates the widget
    const timer = setInterval(() => fetchWeekActivity().then(setActiveDates), 30000);
    return () => clearInterval(timer);
  }, []);

  // Build current week Mon-Sun in local time
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const todayDow = today.getDay(); // 0=Sun
  const mondayOffset = todayDow === 0 ? 6 : todayDow - 1;

  const allDays: DayState[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(
    (label, id) => {
      const d = new Date(today);
      d.setDate(today.getDate() - mondayOffset + id);
      const dateStr = d.toLocaleDateString('en-CA');
      return {
        label,
        id,
        today: dateStr === todayStr,
        active: activeDates.has(dateStr),
      };
    }
  );

  const row1 = allDays.slice(0, 4);
  const row2 = allDays.slice(4, 7);

  const DayCircle = ({ day }: { day: DayState }) => (
    <div
      className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 shrink-0 rounded-full flex flex-col items-center justify-center font-fredoka font-black text-[12px] sm:text-[13px] lg:text-[14px] transition-all cursor-pointer ${
        day.active
          ? 'bg-flame border-[3px] border-ink text-white hover:-translate-y-1 shadow-[2px_2px_0px_0px_#1E1B3A] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_#1E1B3A]'
          : day.today
          ? 'bg-white border-[3px] border-violet text-violet hover:-translate-y-1 shadow-[4px_4px_0px_0px_#6C4DFF] active:translate-y-0 active:translate-x-0 active:shadow-[2px_2px_0px_0px_#6C4DFF]'
          : 'bg-cloud border-[3px] border-ink text-ink/40'
      }`}
    >
      {day.label}
    </div>
  );

  return (
    <div className="bg-white rounded-[24px] border-[3px] border-ink p-6 space-y-5 shadow-[4px_4px_0px_0px_#1E1B3A]">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-flame/10 rounded-xl border-[2px] border-flame">
          <svg className="w-5 h-5 text-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        </div>
        <h2 className="text-sm font-fredoka font-black text-ink uppercase tracking-wider">Streak Week</h2>
      </div>

      <div className="flex flex-col gap-3 w-full items-center pt-2">
        <div className="flex justify-center items-center w-full gap-2 sm:gap-3">
          {row1.map((day) => (
            <DayCircle key={day.id} day={day} />
          ))}
        </div>
        <div className="flex justify-center items-center w-full gap-2 sm:gap-3">
          {row2.map((day) => (
            <DayCircle key={day.id} day={day} />
          ))}
        </div>
      </div>
    </div>
  );
};
