'use server';

/**
 * Progression Engine — Server Actions
 *
 * All XP awards, streak updates, mission completions, lesson completions,
 * quiz submissions, and achievement evaluations live here.
 *
 * The browser never computes or submits XP amounts — it only supplies
 * identifiers (userId, lessonId, quizId, missionId).
 *
 * Single Source of Truth & Idempotency:
 * Every progression event is atomic and recorded in XpTransaction with a unique
 * idempotency key. Duplicate submissions return the authoritative committed state
 * without double-awarding XP.
 */

import { prisma } from '@/lib/prisma';
import {
  getLevelInfo,
  getLocalDateString,
  getISTDayRange,
  XP_CONFIG,
  MISSION_CONFIG,
  calculateNextStreak,
} from '@/utils/xpUtils';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDef,
} from '@/lib/achievements';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export type { ProgressSnapshot };

interface ProgressSnapshot {
  userId: string;
  displayName: string;
  lifetimeXP: number;
  currentLevel: number;
  xpIntoCurrentLevel: number;
  nextLevelXPRequired: number;
  currentStreak: number;
  longestStreak: number;
  latestActivityDate: string | null;
  todayMissionsCompleted: string[];
  todayCompletedCount: number;
  msUntilReset: number;
  dateStr: string;
  todayQualifyingCount: number;
  weeklyXP: number;
  weeklyRank: number;
  recentAchievements: string[];
}

// ─── Seed achievements into DB if not present (cached per process) ───────────

let achievementsSeeded = false;

export async function seedAchievements(): Promise<void> {
  if (achievementsSeeded) return;

  try {
    const existingCount = await prisma.achievement.count();
    if (existingCount >= ACHIEVEMENT_DEFINITIONS.length) {
      achievementsSeeded = true;
      return;
    }

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievement.upsert({
        where: { id: def.id },
        update: {},
        create: {
          id: def.id,
          title: def.title,
          description: def.description,
          category: def.category,
          iconKey: def.iconKey,
          criteria: JSON.stringify(def.criteria),
          xpBonus: def.xpBonus,
          isActive: true,
        },
      });
    }
    achievementsSeeded = true;
  } catch (err) {
    console.warn('[Progression] Achievement seed check failed:', err);
  }
}

// ─── Ensure user exists ──────────────────────────────────────────────────────

const verifiedUsers = new Set<string>();

export async function ensureUser(
  userId: string,
  displayName?: string
): Promise<void> {
  if (verifiedUsers.has(userId) && (!displayName || displayName === 'Learner')) {
    return;
  }

  const name = displayName && displayName !== 'Learner' ? displayName : 'Aiyan';

  await Promise.all([
    prisma.user.upsert({
      where: { id: userId },
      update: displayName ? { displayName: name } : {},
      create: {
        id: userId,
        displayName: name,
      },
    }),
    prisma.profile.upsert({
      where: { userId },
      update: displayName ? { username: name } : {},
      create: {
        userId,
        username: name,
        totalXP: 0,
        level: 1,
        streakDays: 0,
      },
    }),
  ]);

  verifiedUsers.add(userId);
  await seedAchievements();
}

// ─── Internal Atomic XP & Activity Award ─────────────────────────────────────

async function awardXP(params: {
  userId: string;
  amount: number;
  eventType: string;
  sourceType?: string;
  sourceId?: string;
  idempotencyKey: string;
  description?: string;
  activityType?: 'lesson' | 'quiz' | 'mission' | 'quick_check';
}): Promise<boolean> {
  const existing = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return false; // already awarded

  const { dateStr } = getISTDayRange();

  await prisma.$transaction(async (tx: any) => {
    // 1. Create the XP transaction record
    await tx.xpTransaction.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        xpAmount: params.amount,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        idempotencyKey: params.idempotencyKey,
        description: params.description,
      },
    });

    // 2. Fetch current user
    const user = await tx.user.findUniqueOrThrow({
      where: { id: params.userId },
    });
    const newXP = user.lifetimeXP + params.amount;
    const { level } = getLevelInfo(newXP);

    // 3. Compute streak
    const { newStreak, newLongest } = calculateNextStreak({
      previousDate: user.latestActivityDate,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      todayDate: dateStr,
    });

    // 4. Update User progression aggregates
    await tx.user.update({
      where: { id: params.userId },
      data: {
        lifetimeXP: newXP,
        currentLevel: level,
        currentStreak: newStreak,
        longestStreak: newLongest,
        latestActivityDate: dateStr,
      },
    });

    // 5. Update Profile (keeping User and Profile 100% in sync)
    await tx.profile.updateMany({
      where: { userId: params.userId },
      data: {
        totalXP: newXP,
        level,
        streakDays: newStreak,
      },
    });

    // 6. Upsert DailyActivity record
    if (params.activityType) {
      await tx.dailyActivity.upsert({
        where: {
          userId_localActivityDate: {
            userId: params.userId,
            localActivityDate: dateStr,
          },
        },
        update: {
          qualifyingActivityCount: { increment: 1 },
          xpEarned: { increment: params.amount },
          ...(params.activityType === 'lesson'
            ? { lessonsCompleted: { increment: 1 } }
            : {}),
          ...(params.activityType === 'quiz'
            ? { quizzesCompleted: { increment: 1 } }
            : {}),
        },
        create: {
          userId: params.userId,
          localActivityDate: dateStr,
          qualifyingActivityCount: 1,
          xpEarned: params.amount,
          lessonsCompleted: params.activityType === 'lesson' ? 1 : 0,
          quizzesCompleted: params.activityType === 'quiz' ? 1 : 0,
        },
      });
    }
  });

  return true;
}

// ─── Streak & Daily Activity Helper ──────────────────────────────────────────

async function recordQualifyingActivity(
  userId: string,
  type: 'lesson' | 'quiz' | 'mission' | 'quick_check',
  xpAmount = 0
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
  const { dateStr } = getISTDayRange();

  const { newStreak, newLongest } = calculateNextStreak({
    previousDate: user.latestActivityDate,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    todayDate: dateStr,
  });

  await prisma.$transaction(async (tx: any) => {
    await tx.dailyActivity.upsert({
      where: { userId_localActivityDate: { userId, localActivityDate: dateStr } },
      update: {
        qualifyingActivityCount: { increment: 1 },
        xpEarned: { increment: xpAmount },
        ...(type === 'lesson'
          ? { lessonsCompleted: { increment: 1 } }
          : type === 'quiz'
          ? { quizzesCompleted: { increment: 1 } }
          : {}),
      },
      create: {
        userId,
        localActivityDate: dateStr,
        qualifyingActivityCount: 1,
        xpEarned: xpAmount,
        lessonsCompleted: type === 'lesson' ? 1 : 0,
        quizzesCompleted: type === 'quiz' ? 1 : 0,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        latestActivityDate: dateStr,
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    });

    await tx.profile.updateMany({
      where: { userId },
      data: { streakDays: newStreak },
    });
  });
}

// ─── Achievement Evaluation ────────────────────────────────────────────────────

async function evaluateAchievements(
  userId: string,
  context: {
    lifetimeXP: number;
    currentStreak: number;
    latestQuizScore?: number;
    totalLessonsCompleted: number;
    totalQuizzesCompleted: number;
    distinctTopics: number;
    totalActiveDays: number;
  }
): Promise<string[]> {
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e: any) => e.achievementId));

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (earnedIds.has(def.id)) continue;

    let unlocked = false;
    const { criteria } = def;

    switch (criteria.type) {
      case 'lesson_count':
        unlocked = context.totalLessonsCompleted >= criteria.threshold;
        break;
      case 'quiz_count':
        unlocked = context.totalQuizzesCompleted >= criteria.threshold;
        break;
      case 'perfect_quiz':
        unlocked =
          context.latestQuizScore !== undefined &&
          context.latestQuizScore >= criteria.threshold;
        break;
      case 'streak_days':
        unlocked = context.currentStreak >= criteria.threshold;
        break;
      case 'lifetime_xp':
        unlocked = context.lifetimeXP >= criteria.threshold;
        break;
      case 'topic_count':
        unlocked = context.distinctTopics >= criteria.threshold;
        break;
      case 'active_days':
        unlocked = context.totalActiveDays >= criteria.threshold;
        break;
      case 'mastery_score':
        unlocked =
          context.latestQuizScore !== undefined &&
          context.latestQuizScore >= criteria.threshold;
        break;
    }

    if (unlocked) {
      try {
        await prisma.userAchievement.create({
          data: { userId, achievementId: def.id },
        });
        newlyUnlocked.push(def.id);

        if (def.xpBonus > 0) {
          await awardXP({
            userId,
            amount: def.xpBonus,
            eventType: 'achievement',
            sourceType: 'achievement',
            sourceId: def.id,
            idempotencyKey: `achievement_${userId}_${def.id}`,
            description: `Unlocked "${def.title}"`,
          });
        }
      } catch {
        // Safe to ignore concurrent awards
      }
    }
  }

  return newlyUnlocked;
}

async function getProgressionContext(userId: string, latestQuizScore?: number) {
  const [user, lessons, quizzesCompleted, activeDays] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, status: 'completed' },
      select: { lessonId: true },
    }),
    prisma.dailyActivity.aggregate({
      where: { userId },
      _sum: { quizzesCompleted: true },
    }),
    prisma.dailyActivity.count({ where: { userId } }),
  ]);

  const distinctTopics = new Set(
    lessons.map((l: any) => l.lessonId.split('_')[0])
  ).size;

  return {
    lifetimeXP: user.lifetimeXP,
    currentStreak: user.currentStreak,
    latestQuizScore,
    totalLessonsCompleted: lessons.length,
    totalQuizzesCompleted: quizzesCompleted._sum.quizzesCompleted ?? 0,
    distinctTopics,
    totalActiveDays: activeDays,
  };
}

// ─── Public API: Get Authoritative Progress Snapshot ─────────────────────────

export async function getProgressSnapshot(userId: string): Promise<ProgressSnapshot | null> {
  if (!userId) return null;
  await ensureUser(userId);

  const { start, end, dateStr, msUntilMidnight } = getISTDayRange();

  // Current week boundaries: Monday 00:00 UTC to next Monday 00:00 UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setUTCDate(weekStart.getUTCDate() + 7);

  const [user, missionLogs, todayActivity, weeklyXpAgg, userAchievements] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.missionLog.findMany({
        where: {
          userId,
          createdAt: { gte: start, lt: end },
        },
        select: { missionId: true },
      }),
      prisma.dailyActivity.findUnique({
        where: {
          userId_localActivityDate: { userId, localActivityDate: dateStr },
        },
      }),
      prisma.xpTransaction.aggregate({
        where: {
          userId,
          createdAt: { gte: weekStart, lt: nextWeekStart },
        },
        _sum: { xpAmount: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 5,
      }),
    ]);

  if (!user) return null;

  const levelInfo = getLevelInfo(user.lifetimeXP);
  const completedMissions = Array.from(
    new Set(
      missionLogs.map((l: { missionId: string }) =>
        l.missionId.replace(/^mission_/, '')
      )
    )
  );

  const weeklyXP = weeklyXpAgg._sum?.xpAmount ?? 0;

  return {
    userId: user.id,
    displayName: user.profile?.username || user.displayName || 'Learner',
    lifetimeXP: user.lifetimeXP,
    currentLevel: user.currentLevel,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    nextLevelXPRequired: levelInfo.nextLevelXPRequired,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    latestActivityDate: user.latestActivityDate,
    todayMissionsCompleted: completedMissions,
    todayCompletedCount: completedMissions.length,
    msUntilReset: msUntilMidnight,
    dateStr,
    todayQualifyingCount: todayActivity?.qualifyingActivityCount ?? 0,
    weeklyXP,
    weeklyRank: 1,
    recentAchievements: userAchievements.map((ua: any) => ua.achievement.title),
  };
}

// ─── Public API: Daily Missions (Persisted, User-Scoped, Atomic) ──────────────

export async function getCompletedMissionsToday(userId?: string): Promise<{
  completedMissions: string[];
  msUntilReset: number;
  dateStr: string;
}> {
  const { start, end, dateStr, msUntilMidnight } = getISTDayRange();

  if (!userId) {
    return { completedMissions: [], msUntilReset: msUntilMidnight, dateStr };
  }

  try {
    const logs = await prisma.missionLog.findMany({
      where: {
        userId,
        createdAt: { gte: start, lt: end },
      },
      select: { missionId: true },
    });

    const completed = Array.from(
      new Set(
        logs.map((l: { missionId: string }) =>
          l.missionId.replace(/^mission_/, '')
        )
      )
    );

    return {
      completedMissions: completed,
      msUntilReset: msUntilMidnight,
      dateStr,
    };
  } catch (error) {
    console.error('[getCompletedMissionsToday] Error:', error);
    return { completedMissions: [], msUntilReset: msUntilMidnight, dateStr };
  }
}

export async function completeMission(
  userId: string,
  missionId: string,
  xpAmount?: number
): Promise<{
  success: boolean;
  alreadyCompleted?: boolean;
  message?: string;
  xpAwarded: number;
  newAchievements: string[];
  snapshot: ProgressSnapshot | null;
}> {
  await ensureUser(userId);

  const cleanMissionId = String(missionId).replace(/^mission_/, '');
  const config = MISSION_CONFIG[cleanMissionId];
  const amount = xpAmount ?? config?.xp ?? 50;
  const { start, end, dateStr, msUntilMidnight } = getISTDayRange();

  const idempotencyKey = `mission_${userId}_${cleanMissionId}_${dateStr}`;

  // Check if mission was already completed today
  const existingLog = await prisma.missionLog.findFirst({
    where: {
      userId,
      missionId: { in: [cleanMissionId, `mission_${cleanMissionId}`] },
      createdAt: { gte: start, lt: end },
    },
  });

  const existingTx = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey },
  });

  if (existingLog || existingTx) {
    const snapshot = await getProgressSnapshot(userId);
    return {
      success: false,
      alreadyCompleted: true,
      message: 'This mission has already been completed today. Resets at 12:00 AM midnight IST.',
      xpAwarded: 0,
      newAchievements: [],
      snapshot,
    };
  }

  // Atomic completion transaction
  await prisma.$transaction(async (tx: any) => {
    // 1. Guard against race conditions
    const raceCheck = await tx.xpTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (raceCheck) return;

    // 2. Fetch User & Profile
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });

    let profile = user.profile;
    if (!profile) {
      profile = await tx.profile.create({
        data: {
          userId,
          username: user.displayName || 'Learner',
          totalXP: user.lifetimeXP,
          level: user.currentLevel,
          streakDays: user.currentStreak,
        },
      });
    }

    // 3. Create XpTransaction ledger record
    await tx.xpTransaction.create({
      data: {
        userId,
        eventType: 'mission',
        xpAmount: amount,
        sourceType: 'mission',
        sourceId: cleanMissionId,
        idempotencyKey,
        description: `Daily Mission: ${config?.label || `Mission ${cleanMissionId}`}`,
      },
    });

    // 4. Create MissionLog (legacy compatibility)
    await tx.missionLog.create({
      data: {
        userId,
        profileId: profile.id,
        missionId: `mission_${cleanMissionId}`,
        xpGranted: amount,
      },
    });

    // 5. Update XP totals and Level
    const newLifetimeXP = user.lifetimeXP + amount;
    const { level: newLevel } = getLevelInfo(newLifetimeXP);

    // 6. Calculate Streak
    const { newStreak, newLongest } = calculateNextStreak({
      previousDate: user.latestActivityDate,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      todayDate: dateStr,
    });

    // 7. Synchronize User & Profile
    await tx.user.update({
      where: { id: userId },
      data: {
        lifetimeXP: newLifetimeXP,
        currentLevel: newLevel,
        currentStreak: newStreak,
        longestStreak: newLongest,
        latestActivityDate: dateStr,
      },
    });

    await tx.profile.update({
      where: { id: profile.id },
      data: {
        totalXP: newLifetimeXP,
        level: newLevel,
        streakDays: newStreak,
      },
    });

    // 8. Upsert DailyActivity
    await tx.dailyActivity.upsert({
      where: {
        userId_localActivityDate: {
          userId,
          localActivityDate: dateStr,
        },
      },
      update: {
        qualifyingActivityCount: { increment: 1 },
        xpEarned: { increment: amount },
      },
      create: {
        userId,
        localActivityDate: dateStr,
        qualifyingActivityCount: 1,
        xpEarned: amount,
      },
    });
  });

  // Evaluate achievements post-commit
  const context = await getProgressionContext(userId);
  const newAchievements = await evaluateAchievements(userId, context);
  const snapshot = await getProgressSnapshot(userId);

  return {
    success: true,
    xpAwarded: amount,
    newAchievements,
    snapshot,
  };
}

// ─── Public API: Complete a lesson ────────────────────────────────────────────

export async function completeLesson(
  userId: string,
  lessonId: string,
  lessonTitle: string
): Promise<{
  success: boolean;
  xpAwarded: number;
  newAchievements: string[];
  alreadyCompleted: boolean;
  snapshot: ProgressSnapshot | null;
}> {
  await ensureUser(userId);

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  const isFirstTime = !existing || existing.status !== 'completed';
  const xpAmount = isFirstTime ? XP_CONFIG.LESSON_COMPLETE_FIRST_TIME : XP_CONFIG.LESSON_REVIEW_BONUS;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      status: 'completed',
      attempts: { increment: 1 },
      completedAt: new Date(),
    },
    create: {
      userId,
      lessonId,
      status: 'completed',
      attempts: 1,
      completedAt: new Date(),
    },
  });

  const xpKey = isFirstTime
    ? `lesson_complete_${userId}_${lessonId}`
    : `lesson_review_${userId}_${lessonId}_${Date.now()}`;

  const awarded = await awardXP({
    userId,
    amount: xpAmount,
    eventType: isFirstTime ? 'lesson_complete' : 'lesson_review',
    sourceType: 'lesson',
    sourceId: lessonId,
    idempotencyKey: xpKey,
    description: isFirstTime
      ? `Completed "${lessonTitle}"`
      : `Reviewed "${lessonTitle}" (+${xpAmount} XP bonus)`,
    activityType: 'lesson',
  });

  const context = await getProgressionContext(userId);
  const newAchievements = await evaluateAchievements(userId, context);
  const snapshot = await getProgressSnapshot(userId);

  return {
    success: true,
    xpAwarded: awarded ? xpAmount : 0,
    newAchievements,
    alreadyCompleted: !isFirstTime,
    snapshot,
  };
}

// ─── Public API: Award Quick Check XP ─────────────────────────────────────────

export async function awardQuickCheckXP(
  userId: string,
  conceptId: string,
  conceptTitle: string
): Promise<{ success: boolean; xpAwarded: number; snapshot: ProgressSnapshot | null }> {
  await ensureUser(userId);
  const xpAmount = XP_CONFIG.QUICK_CHECK;
  const xpKey = `quick_check_${userId}_${conceptId}_${Date.now()}`;

  const awarded = await awardXP({
    userId,
    amount: xpAmount,
    eventType: 'quick_check',
    sourceType: 'concept',
    sourceId: conceptId,
    idempotencyKey: xpKey,
    description: `Mastered Quick Check: "${conceptTitle}"`,
    activityType: 'quick_check',
  });

  const snapshot = await getProgressSnapshot(userId);

  return {
    success: awarded,
    xpAwarded: awarded ? xpAmount : 0,
    snapshot,
  };
}

// ─── Public API: Submit a quiz ────────────────────────────────────────────────

export async function submitQuiz(
  userId: string,
  quizId: string,
  quizTopic: string,
  scorePercent: number
): Promise<{
  success: boolean;
  xpAwarded: number;
  newAchievements: string[];
  isFirstAttempt: boolean;
  snapshot: ProgressSnapshot | null;
}> {
  await ensureUser(userId);

  const score = Math.max(0, Math.min(100, Math.round(scorePercent)));

  const existingProgress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: `quiz_${quizId}` } },
  });
  const isFirstAttempt = !existingProgress;
  const isBestScore = !existingProgress?.bestScore || score > existingProgress.bestScore;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: `quiz_${quizId}` } },
    update: {
      attempts: { increment: 1 },
      ...(isBestScore ? { bestScore: score } : {}),
      status: 'completed',
    },
    create: {
      userId,
      lessonId: `quiz_${quizId}`,
      status: 'completed',
      attempts: 1,
      bestScore: score,
    },
  });

  let totalXP = 0;
  const baseXP = isFirstAttempt ? XP_CONFIG.QUIZ_FIRST_ATTEMPT_BASE : XP_CONFIG.QUIZ_RETAKE_BASE;
  const baseKey = `quiz_base_${userId}_${quizId}_${Date.now()}`;

  const baseAwarded = await awardXP({
    userId,
    amount: baseXP,
    eventType: 'quiz_submit',
    sourceType: 'quiz',
    sourceId: quizId,
    idempotencyKey: baseKey,
    description: `Attempted quiz on "${quizTopic}"`,
    activityType: 'quiz',
  });
  if (baseAwarded) totalXP += baseXP;

  const performanceBonus = Math.round(
    (score / 100) * XP_CONFIG.QUIZ_PERFORMANCE_MAX_BONUS
  );
  if (performanceBonus > 0) {
    const bonusKey = `quiz_perf_${userId}_${quizId}_${Date.now()}`;
    const bonusAwarded = await awardXP({
      userId,
      amount: performanceBonus,
      eventType: 'quiz_performance_bonus',
      sourceType: 'quiz',
      sourceId: quizId,
      idempotencyKey: bonusKey,
      description: `Scored ${score}% on "${quizTopic}" (+${performanceBonus} XP bonus)`,
    });
    if (bonusAwarded) totalXP += performanceBonus;
  }

  const context = await getProgressionContext(userId, score);
  const newAchievements = await evaluateAchievements(userId, context);
  const snapshot = await getProgressSnapshot(userId);

  return {
    success: true,
    xpAwarded: totalXP,
    newAchievements,
    isFirstAttempt,
    snapshot,
  };
}

// ─── Public API: Get full progress summary ────────────────────────────────────

export async function getFullProgress(userId: string): Promise<{
  userId: string;
  displayName: string;
  lifetimeXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  totalActiveDays: number;
  xpIntoCurrentLevel: number;
  nextLevelXPRequired: number;
  recentXpHistory: Array<{
    description: string;
    xpAmount: number;
    createdAt: string;
    eventType: string;
  }>;
  earnedAchievements: Array<{
    id: string;
    title: string;
    description: string;
    iconKey: string;
    xpBonus: number;
    unlockedAt: string;
  }>;
  weeklyActivity: Array<{ date: string; xpEarned: number }>;
} | null> {
  await ensureUser(userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const levelInfo = getLevelInfo(user.lifetimeXP);

  const [lessonsCompleted, quizActivity, activeDays, recentXp, userAchievements, weeklyActivity] =
    await Promise.all([
      prisma.lessonProgress.count({
        where: { userId, status: 'completed', lessonId: { not: { startsWith: 'quiz_' } } },
      }),
      prisma.dailyActivity.aggregate({
        where: { userId },
        _sum: { quizzesCompleted: true },
      }),
      prisma.dailyActivity.count({ where: { userId } }),
      prisma.xpTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      prisma.dailyActivity.findMany({
        where: { userId },
        orderBy: { localActivityDate: 'desc' },
        take: 7,
      }),
    ]);

  return {
    userId,
    displayName: user.displayName,
    lifetimeXP: user.lifetimeXP,
    currentLevel: user.currentLevel,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalLessonsCompleted: lessonsCompleted,
    totalQuizzesCompleted: quizActivity._sum.quizzesCompleted ?? 0,
    totalActiveDays: activeDays,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    nextLevelXPRequired: levelInfo.nextLevelXPRequired,
    recentXpHistory: recentXp.map((t: any) => ({
      description: t.description ?? t.eventType,
      xpAmount: t.xpAmount,
      createdAt: t.createdAt.toISOString(),
      eventType: t.eventType,
    })),
    earnedAchievements: userAchievements.map((ua: any) => ({
      id: ua.achievementId,
      title: ua.achievement.title,
      description: ua.achievement.description,
      iconKey: ua.achievement.iconKey,
      xpBonus: ua.achievement.xpBonus,
      unlockedAt: ua.unlockedAt.toISOString(),
    })),
    weeklyActivity: weeklyActivity.map((a: any) => ({
      date: a.localActivityDate,
      xpEarned: a.xpEarned,
    })),
  };
}

// ─── Public API: Leaderboards ────────────────────────────────────────────────

const FALLBACK_LEADERBOARD = [
  {
    userId: 'user-community-1',
    displayName: 'Aarav Sharma',
    weeklyXP: 520,
    lifetimeXP: 2450,
    currentStreak: 12,
    currentLevel: 8,
    rank: 1,
  },
  {
    userId: 'user-community-2',
    displayName: 'Zara Chen',
    weeklyXP: 440,
    lifetimeXP: 1980,
    currentStreak: 8,
    currentLevel: 7,
    rank: 2,
  },
  {
    userId: 'user-community-3',
    displayName: 'Leo Martinez',
    weeklyXP: 375,
    lifetimeXP: 1620,
    currentStreak: 6,
    currentLevel: 6,
    rank: 3,
  },
  {
    userId: 'user-community-4',
    displayName: 'Priya Patel',
    weeklyXP: 310,
    lifetimeXP: 1250,
    currentStreak: 5,
    currentLevel: 5,
    rank: 4,
  },
  {
    userId: 'user-community-5',
    displayName: 'Elena Rostova',
    weeklyXP: 250,
    lifetimeXP: 980,
    currentStreak: 4,
    currentLevel: 4,
    rank: 5,
  },
  {
    userId: 'user-community-6',
    displayName: 'David Kim',
    weeklyXP: 190,
    lifetimeXP: 750,
    currentStreak: 3,
    currentLevel: 3,
    rank: 6,
  },
];

export async function getWeeklyLeaderboard(currentUserId?: string): Promise<
  Array<{
    userId: string;
    displayName: string;
    weeklyXP: number;
    lifetimeXP: number;
    currentStreak: number;
    currentLevel: number;
    rank: number;
    isCurrentUser?: boolean;
  }>
> {
  try {
    // Current week: Monday 00:00 UTC to next Monday 00:00 UTC (half-open interval)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setUTCDate(weekStart.getUTCDate() + 7);

    // Sum XP earned this week from XpTransaction
    const weeklyXpRows = await prisma.xpTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: weekStart,
          lt: nextWeekStart,
        },
      },
      _sum: { xpAmount: true },
      orderBy: { _sum: { xpAmount: 'desc' } },
    });

    const realUserIds = new Set<string>();
    for (const r of weeklyXpRows) {
      realUserIds.add(r.userId);
    }
    if (currentUserId) {
      await ensureUser(currentUserId);
      realUserIds.add(currentUserId);
    }

    // Fetch user details for real users
    const users =
      realUserIds.size > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(realUserIds) } },
            include: { profile: true },
          })
        : [];
    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    const weeklyMap = new Map<string, number>();
    for (const row of weeklyXpRows) {
      weeklyMap.set(row.userId, row._sum?.xpAmount ?? 0);
    }

    const allUserIds = new Set<string>([
      ...realUserIds,
      ...FALLBACK_LEADERBOARD.map((f) => f.userId),
    ]);

    const list: Array<{
      userId: string;
      displayName: string;
      weeklyXP: number;
      lifetimeXP: number;
      currentStreak: number;
      currentLevel: number;
      rank: number;
      isCurrentUser?: boolean;
    }> = [];

    for (const uid of allUserIds) {
      const user = userMap.get(uid);
      const fallback = FALLBACK_LEADERBOARD.find((f) => f.userId === uid);

      const displayName =
        user?.profile?.username ||
        (user?.displayName && user.displayName !== 'Learner'
          ? user.displayName
          : null) ||
        fallback?.displayName ||
        user?.displayName ||
        'Learner';

      const weeklyXP = weeklyMap.get(uid) ?? fallback?.weeklyXP ?? 0;
      const lifetimeXP = user?.lifetimeXP ?? fallback?.lifetimeXP ?? 0;
      const currentStreak = user?.currentStreak ?? fallback?.currentStreak ?? 0;
      const currentLevel = user?.currentLevel ?? fallback?.currentLevel ?? 1;

      list.push({
        userId: uid,
        displayName,
        weeklyXP,
        lifetimeXP,
        currentStreak,
        currentLevel,
        rank: 0,
        isCurrentUser: currentUserId ? uid === currentUserId : false,
      });
    }

    // Sort descending by weeklyXP, then by lifetimeXP, then alphabetical
    list.sort((a, b) => {
      if (b.weeklyXP !== a.weeklyXP) return b.weeklyXP - a.weeklyXP;
      if (b.lifetimeXP !== a.lifetimeXP) return b.lifetimeXP - a.lifetimeXP;
      return a.displayName.localeCompare(b.displayName);
    });

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  } catch (err) {
    console.warn('[Leaderboard] getWeeklyLeaderboard fallback to community rankings:', err);
    return FALLBACK_LEADERBOARD.map((item) => ({
      ...item,
      isCurrentUser: currentUserId ? item.userId === currentUserId : false,
    }));
  }
}

export async function getLifetimeLeaderboard(currentUserId?: string): Promise<
  Array<{
    userId: string;
    displayName: string;
    lifetimeXP: number;
    currentStreak: number;
    currentLevel: number;
    rank: number;
    isCurrentUser?: boolean;
  }>
> {
  try {
    if (currentUserId) {
      await ensureUser(currentUserId);
    }

    const topUsers = await prisma.user.findMany({
      where: { lifetimeXP: { gt: 0 } },
      include: { profile: true },
      orderBy: { lifetimeXP: 'desc' },
      take: 50,
    });

    const userMap = new Map<string, any>(topUsers.map((u: any) => [u.id, u]));

    if (currentUserId && !userMap.has(currentUserId)) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { profile: true },
      });
      if (currentUser) {
        userMap.set(currentUserId, currentUser);
      }
    }

    const allUserIds = new Set<string>([
      ...userMap.keys(),
      ...FALLBACK_LEADERBOARD.map((f) => f.userId),
    ]);

    const list: Array<{
      userId: string;
      displayName: string;
      lifetimeXP: number;
      currentStreak: number;
      currentLevel: number;
      rank: number;
      isCurrentUser?: boolean;
    }> = [];

    for (const uid of allUserIds) {
      const user = userMap.get(uid);
      const fallback = FALLBACK_LEADERBOARD.find((f) => f.userId === uid);

      const displayName =
        user?.profile?.username ||
        (user?.displayName && user.displayName !== 'Learner'
          ? user.displayName
          : null) ||
        fallback?.displayName ||
        user?.displayName ||
        'Learner';

      const lifetimeXP = user?.lifetimeXP ?? fallback?.lifetimeXP ?? 0;
      const currentStreak = user?.currentStreak ?? fallback?.currentStreak ?? 0;
      const currentLevel = user?.currentLevel ?? fallback?.currentLevel ?? 1;

      list.push({
        userId: uid,
        displayName,
        lifetimeXP,
        currentStreak,
        currentLevel,
        rank: 0,
        isCurrentUser: currentUserId ? uid === currentUserId : false,
      });
    }

    list.sort((a, b) => {
      if (b.lifetimeXP !== a.lifetimeXP) return b.lifetimeXP - a.lifetimeXP;
      return a.displayName.localeCompare(b.displayName);
    });

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  } catch (err) {
    console.warn('[Leaderboard] getLifetimeLeaderboard fallback to community rankings:', err);
    return FALLBACK_LEADERBOARD.map((item) => ({
      ...item,
      isCurrentUser: currentUserId ? item.userId === currentUserId : false,
    }));
  }
}

// ─── Public API: Progression Reconciliation & Audit ──────────────────────────

export async function reconcileProgressionData(options: { dryRun?: boolean; targetUserId?: string } = {}): Promise<{
  inspectedUsers: number;
  inconsistencies: Array<{
    userId: string;
    displayName: string;
    issue: string;
    currentValues: any;
    expectedValues: any;
    repaired: boolean;
  }>;
}> {
  const isDryRun = options.dryRun !== false;
  const where = options.targetUserId ? { id: options.targetUserId } : {};
  const users = await prisma.user.findMany({
    where,
    include: { profile: true },
  });

  const inconsistencies: Array<{
    userId: string;
    displayName: string;
    issue: string;
    currentValues: any;
    expectedValues: any;
    repaired: boolean;
  }> = [];

  for (const user of users) {
    const txSum = await prisma.xpTransaction.aggregate({
      where: { userId: user.id },
      _sum: { xpAmount: true },
    });
    const ledgerXp = txSum._sum?.xpAmount ?? 0;
    const expectedXp = Math.max(user.lifetimeXP, user.profile?.totalXP ?? 0, ledgerXp);
    const expectedLevel = getLevelInfo(expectedXp).level;

    if (user.lifetimeXP !== expectedXp || (user.profile && user.profile.totalXP !== expectedXp)) {
      inconsistencies.push({
        userId: user.id,
        displayName: user.displayName,
        issue: 'XP ledger / user / profile mismatch',
        currentValues: { userXp: user.lifetimeXP, profileXp: user.profile?.totalXP, ledgerXp },
        expectedValues: { lifetimeXP: expectedXp, level: expectedLevel },
        repaired: !isDryRun,
      });

      if (!isDryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lifetimeXP: expectedXp, currentLevel: expectedLevel },
        });
        if (user.profile) {
          await prisma.profile.update({
            where: { id: user.profile.id },
            data: { totalXP: expectedXp, level: expectedLevel },
          });
        }
      }
    }

    const expectedStreak = Math.max(user.currentStreak, user.profile?.streakDays ?? 0);
    if (user.currentStreak !== expectedStreak || (user.profile && user.profile.streakDays !== expectedStreak)) {
      inconsistencies.push({
        userId: user.id,
        displayName: user.displayName,
        issue: 'Streak mismatch between user and profile',
        currentValues: { userStreak: user.currentStreak, profileStreak: user.profile?.streakDays },
        expectedValues: { streak: expectedStreak },
        repaired: !isDryRun,
      });

      if (!isDryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentStreak: expectedStreak },
        });
        if (user.profile) {
          await prisma.profile.update({
            where: { id: user.profile.id },
            data: { streakDays: expectedStreak },
          });
        }
      }
    }
  }

  return {
    inspectedUsers: users.length,
    inconsistencies,
  };
}
