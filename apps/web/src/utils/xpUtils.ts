/**
 * XP Level system.
 *
 * Cumulative XP required to reach level L:
 *   threshold(L) = 100 * (L - 1) + 25 * (L - 1) * (L - 2)
 *
 * Examples:
 *   L=1 → 0      L=2 → 100    L=3 → 250   L=4 → 450
 *   L=5 → 700    L=6 → 1000   L=7 → 1350  L=8 → 1750
 *   L=9 → 2200   L=10 → 2700
 */

export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const L = level;
  return 100 * (L - 1) + 25 * (L - 1) * (L - 2);
}

export function getLevelInfo(totalXP: number): {
  level: number;
  xpIntoCurrentLevel: number;
  nextLevelXPRequired: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;

  // Find the highest level whose threshold is <= totalXP
  while (true) {
    const nextThreshold = cumulativeXpForLevel(level + 1);
    if (totalXP >= nextThreshold) {
      level++;
    } else {
      break;
    }
  }

  const xpForCurrentLevel = cumulativeXpForLevel(level);
  const xpForNextLevel = cumulativeXpForLevel(level + 1);
  const xpIntoCurrentLevel = totalXP - xpForCurrentLevel;
  const nextLevelXPRequired = xpForNextLevel - xpForCurrentLevel;

  return {
    level,
    xpIntoCurrentLevel,
    nextLevelXPRequired,
    xpForCurrentLevel,
    xpForNextLevel,
  };
}

/** Human-readable title for a level */
export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Newcomer',
    2: 'Apprentice',
    3: 'Scholar',
    4: 'Explorer',
    5: 'Adept',
    6: 'Expert',
    7: 'Master',
    8: 'Champion',
    9: 'Legend',
    10: 'Grandmaster',
  };
  return titles[level] ?? `Elite ${level}`;
}

/** Get the local YYYY-MM-DD date string for a given Date and timezone */
export function getLocalDateString(date: Date, timezone = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Returns the start and end of the current day in IST (Asia/Kolkata, UTC+05:30),
 * along with the current IST date string "YYYY-MM-DD" and ms until next midnight IST.
 */
export function getISTDayRange(now = new Date()): {
  start: Date;
  end: Date;
  dateStr: string;
  msUntilMidnight: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const year = parseInt(parts.find((p) => p.type === 'year')!.value);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')!.value);

  // 12:00 AM midnight IST in UTC: IST is UTC+5:30 -> UTC is IST - 5h30m
  const start = new Date(
    Date.UTC(year, month, day, 0, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const msUntilMidnight = Math.max(0, end.getTime() - now.getTime());

  return { start, end, dateStr, msUntilMidnight };
}
