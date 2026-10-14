import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Crown, RefreshCw, Users } from 'lucide-react';
import { getWeeklyLeaderboard, getLifetimeLeaderboard } from '../../app/actions/progression';
import { getLevelTitle } from '../../utils/xpUtils';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyXP?: number;
  lifetimeXP: number;
  currentStreak: number;
  currentLevel: number;
  rank: number;
}

const tierForLevel = (level: number) => {
  if (level >= 8) return 'Diamond';
  if (level >= 5) return 'Gold';
  if (level >= 3) return 'Silver';
  return 'Bronze';
};

const tierColors: Record<string, string> = {
  Diamond: 'bg-[#38BDF8] text-white',
  Gold: 'bg-gold text-ink',
  Silver: 'bg-[#E2E8F0] text-ink',
  Bronze: 'bg-[#F59E0B] text-white',
};

export const LeaderboardView: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'lifetime'>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        period === 'weekly'
          ? await getWeeklyLeaderboard()
          : await getLifetimeLeaderboard();
      setEntries(data as LeaderboardEntry[]);
    } catch (err) {
      setError('Could not load leaderboard. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const xpLabel = (entry: LeaderboardEntry) =>
    period === 'weekly'
      ? `${(entry.weeklyXP ?? 0).toLocaleString()} XP this week`
      : `${entry.lifetimeXP.toLocaleString()} XP`;

  const xpValue = (entry: LeaderboardEntry) =>
    period === 'weekly' ? (entry.weeklyXP ?? 0) : entry.lifetimeXP;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold border-[3px] border-ink font-fredoka font-black text-ink uppercase tracking-wide shadow-[3px_3px_0px_0px_#1E1B3A]">
          <Trophy className="w-4 h-4 fill-ink" />
          Global Rankings
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-fredoka text-ink uppercase tracking-wide">
          {period === 'weekly' ? 'Weekly' : 'All-Time'} Leaderboard
        </h1>
        <p className="text-sm font-nunito font-bold text-ink/70 leading-relaxed max-w-xl mx-auto">
          Earn XP by completing AI lessons, passing quizzes, and maintaining your daily streak!
        </p>

        {/* Period toggle */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {(['weekly', 'lifetime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl border-[3px] border-ink font-fredoka font-black text-sm uppercase tracking-wide transition-all ${
                period === p
                  ? 'bg-violet text-white shadow-[2px_2px_0px_0px_#1E1B3A] translate-x-[2px] translate-y-[2px]'
                  : 'bg-white text-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#1E1B3A]'
              }`}
            >
              {p === 'weekly' ? '⚡ This Week' : '🏆 All Time'}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border-[3px] border-ink bg-white shadow-[3px_3px_0px_0px_#1E1B3A] hover:-translate-y-[1px] transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-ink" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-[3px] border-ink border-t-violet rounded-full animate-spin" />
          <p className="font-fredoka font-black text-ink uppercase tracking-wide">Loading Rankings...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#FF5C7A] p-8 text-center">
          <p className="font-nunito font-bold text-ink">{error}</p>
          <button onClick={fetchData} className="mt-4 px-6 py-2 bg-violet text-white font-fredoka font-black rounded-xl border-[3px] border-ink uppercase">
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] p-12 text-center space-y-4">
          <Users className="w-16 h-16 text-ink/30 mx-auto" />
          <h2 className="font-fredoka font-black text-2xl text-ink uppercase">No Rankings Yet</h2>
          <p className="font-nunito font-bold text-ink/60 max-w-sm mx-auto">
            {period === 'weekly'
              ? 'No XP has been earned this week. Complete a lesson or quiz to appear here!'
              : 'Be the first to earn XP and claim the top spot!'}
          </p>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && !error && top3.length > 0 && (
        <div className="flex justify-center items-end gap-3 sm:gap-6 pt-10 pb-6 px-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center flex-1 max-w-[140px] hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="relative mb-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-[3px] border-ink p-1 shadow-[4px_4px_0px_0px_#A0AAB2]">
                  <div className="w-full h-full bg-[#E2E8F0] rounded-full flex items-center justify-center text-xl sm:text-3xl font-fredoka font-black text-ink border-[2px] border-ink">
                    {top3[1].displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-[#CBD5E1] rounded-full flex items-center justify-center text-xs sm:text-sm font-fredoka font-black text-ink border-[3px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]">
                  2
                </div>
              </div>
              <div className="text-center w-full bg-white border-[3px] border-b-0 border-ink rounded-t-2xl pt-4 pb-12 sm:pb-16 mt-2">
                <p className="font-nunito font-bold text-ink text-xs sm:text-sm truncate px-2">{top3[1].displayName}</p>
                <p className="text-[10px] sm:text-xs text-violet font-black font-fredoka mt-1 uppercase tracking-wider">{xpValue(top3[1]).toLocaleString()} XP</p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center flex-1 max-w-[160px] z-10 hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="relative mb-4">
                <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                  <Crown className="w-10 h-10 sm:w-12 sm:h-12 fill-gold text-ink" style={{ filter: 'drop-shadow(2px 2px 0px #1E1B3A)' }} />
                </div>
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white border-[3px] border-ink p-1 shadow-[6px_6px_0px_0px_#FFC93C]">
                  <div className="w-full h-full bg-gold rounded-full flex items-center justify-center text-3xl sm:text-5xl font-fredoka font-black text-ink border-[2px] border-ink">
                    {top3[0].displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-3 sm:-bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gold rounded-full flex items-center justify-center text-sm sm:text-lg font-fredoka font-black text-ink border-[3px] border-ink shadow-[3px_3px_0px_0px_#1E1B3A]">
                  1
                </div>
              </div>
              <div className="text-center w-full bg-white border-[3px] border-b-0 border-ink rounded-t-2xl pt-5 pb-16 sm:pb-24 mt-2 shadow-[0px_-4px_0px_0px_rgba(255,201,60,0.5)]">
                <p className="font-nunito font-black text-ink text-sm sm:text-base truncate px-2">{top3[0].displayName}</p>
                <p className="text-xs sm:text-sm text-gold-edge font-black font-fredoka mt-1 uppercase tracking-wider">{xpValue(top3[0]).toLocaleString()} XP</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center flex-1 max-w-[140px] hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="relative mb-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-[3px] border-ink p-1 shadow-[4px_4px_0px_0px_#E99F4C]">
                  <div className="w-full h-full bg-[#F59E0B] rounded-full flex items-center justify-center text-xl sm:text-3xl font-fredoka font-black text-ink border-[2px] border-ink">
                    {top3[2].displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-[#D97706] rounded-full flex items-center justify-center text-xs sm:text-sm font-fredoka font-black text-white border-[3px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]">
                  3
                </div>
              </div>
              <div className="text-center w-full bg-white border-[3px] border-b-0 border-ink rounded-t-2xl pt-4 pb-8 sm:pb-12 mt-2">
                <p className="font-nunito font-bold text-ink text-xs sm:text-sm truncate px-2">{top3[2].displayName}</p>
                <p className="text-[10px] sm:text-xs text-[#D97706] font-black font-fredoka mt-1 uppercase tracking-wider">{xpValue(top3[2]).toLocaleString()} XP</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && !error && entries.length > 0 && (
        <div className="bg-white rounded-[24px] border-[3px] border-ink overflow-hidden shadow-[8px_8px_0px_0px_#6C4DFF]">
          <div className="px-6 py-4 border-b-[3px] border-ink flex items-center justify-between bg-violet text-white">
            <h3 className="font-fredoka font-black text-lg tracking-wide uppercase">Top Learners</h3>
            <div className="flex items-center gap-2 text-xs font-nunito font-bold bg-white text-violet px-3 py-1 rounded-lg border-2 border-ink shadow-[2px_2px_0px_0px_#1E1B3A]">
              <Zap className="w-3.5 h-3.5 fill-violet" />
              {period === 'weekly' ? 'Current Week' : 'All Time'}
            </div>
          </div>

          <div className="divide-y-[3px] divide-ink bg-[#F8F7FA]">
            {entries.map((entry) => {
              const tier = tierForLevel(entry.currentLevel);
              return (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-white transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="text-lg sm:text-xl font-fredoka font-black text-ink/40 w-6 text-right group-hover:text-ink transition-colors">
                      {entry.rank}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-violet flex items-center justify-center text-white font-fredoka font-black text-lg border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_0px_#FFC93C] transition-all">
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-nunito font-extrabold text-ink text-sm group-hover:text-violet transition-colors">
                        {entry.displayName}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs">
                        <span className="flex items-center gap-1 font-nunito font-bold text-ink/70">
                          <Flame className="w-3.5 h-3.5 fill-flame text-flame" />
                          {entry.currentStreak} day streak
                        </span>
                        <span className={`px-2 py-0.5 rounded border-[2px] border-ink text-[10px] uppercase font-fredoka font-black shadow-[1px_1px_0px_0px_#1E1B3A] ${tierColors[tier]}`}>
                          {getLevelTitle(entry.currentLevel)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-fredoka font-black text-ink bg-white px-3 py-1 rounded-xl border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] group-hover:shadow-[3px_3px_0px_0px_#FF5C7A] transition-all">
                      {xpValue(entry).toLocaleString()} <span className="text-[10px] sm:text-xs text-ink/60 uppercase">XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardView;
