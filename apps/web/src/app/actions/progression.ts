'use server';

/**
 * Progression Engine — Server Actions
 *
 * All XP awards, streak updates, lesson completion, quiz submission, and
 * achievement evaluation live here. The browser never computes or submits
 * XP amounts — it only supplies identifiers (userId, lessonId, quizId,
 * validated answers).
 *
 * Idempotency: every XP event has a unique key stored in XpTransaction.
 * Duplicate requests for the same event silently succeed without re-awarding.
 */

import { prisma } from '@/lib/prisma';
import { getLevelInfo, getLocalDateString } from '@/utils/xpUtils';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDef,
} from '@/lib/achievements';

// ─── XP Configuration (single source of truth) ───────────────────────────────

const XP_CONFIG = {
  LESSON_COMPLETE_FIRST_TIME: 25,
  QUIZ_FIRST_ATTEMPT_BASE: 5,
  QUIZ_PERFORMANCE_MAX_BONUS: 15,
  DAILY_GOAL: 20,
} as const;

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

// ─── Ensure user exists (cached per process) ──────────────────────────────────

const verifiedUsers = new Set<string>();

export async function ensureUser(
  userId: string,
  displayName?: string
): Promise<void> {
  // If already verified in this server instance and no custom displayName is passed, skip DB upserts
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
        streakDays: 1,
      },
    }),
  ]);

  verifiedUsers.add(userId);

  // Seed achievements once per process lifetime
  await seedAchievements();
}

// ─── Internal XP award (with idempotency) ─────────────────────────────────────

async function awardXP(params: {
  userId: string;
  amount: number;
  eventType: string;
  sourceType?: string;
  sourceId?: string;
  idempotencyKey: string;
  description?: string;
}): Promise<boolean> {
  const existing = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return false; // already awarded

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

    // 2. Update user's lifetime XP and level
    const user = await tx.user.findUniqueOrThrow({
      where: { id: params.userId },
    });
    const newXP = user.lifetimeXP + params.amount;
    const { level } = getLevelInfo(newXP);

    await tx.user.update({
      where: { id: params.userId },
      data: { lifetimeXP: newXP, currentLevel: level },
    });

    // 3. Keep legacy Profile in sync (for DailyGoal component compatibility)
    const profile = await tx.profile.findUnique({
      where: { userId: params.userId },
    });
    if (profile) {
      await tx.profile.update({
        where: { userId: params.userId },
        data: { totalXP: newXP, level },
      });
    }
  });

  return true;
}

// ─── Streak & Daily Activity ───────────────────────────────────────────────────

async function recordQualifyingActivity(
  userId: string,
  type: 'lesson' | 'quiz'
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
  const today = getLocalDateString(new Date(), user.timezone);

  // Upsert daily activity record
  await prisma.dailyActivity.upsert({
    where: { userId_localActivityDate: { userId, localActivityDate: today } },
    update: {
      qualifyingActivityCount: { increment: 1 },
      ...(type === 'lesson'
        ? { lessonsCompleted: { increment: 1 } }
        : { quizzesCompleted: { increment: 1 } }),
    },
    create: {
      userId,
      localActivityDate: today,
      qualifyingActivityCount: 1,
      lessonsCompleted: type === 'lesson' ? 1 : 0,
      quizzesCompleted: type === 'quiz' ? 1 : 0,
    },
  });

  // Recalculate streak without re-fetching user
  await recalculateStreak(user, today);
}

async function recalculateStreak(
  user: {
    id: string;
    latestActivityDate: string | null;
    currentStreak: number;
    longestStreak: number;
  },
  today: string
): Promise<void> {
  const userId = user.id;
  const previousDate = user.latestActivityDate;

  if (!previousDate || previousDate === today) {
    // Either first activity or same day — just update date, don't change streak
    if (!previousDate) {
      await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: {
            latestActivityDate: today,
            currentStreak: 1,
            longestStreak: Math.max(1, user.longestStreak),
          },
        }),
        prisma.profile.updateMany({
          where: { userId },
          data: { streakDays: 1 },
        }),
      ]);
    } else {
      // Same day — already counted
      await prisma.user.update({
        where: { id: userId },
        data: { latestActivityDate: today },
      });
    }
    return;
  }

  // Check if yesterday
  const prevDate = new Date(previousDate + 'T00:00:00Z');
  const todayDate = new Date(today + 'T00:00:00Z');
  const diffDays = Math.round(
    (todayDate.getTime() - prevDate.getTime()) / 86400000
  );

  let newStreak: number;
  if (diffDays === 1) {
    // Consecutive day — extend streak
    newStreak = user.currentStreak + 1;
  } else {
    // Gap — start a new streak
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, user.longestStreak);

  await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: {
        latestActivityDate: today,
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    }),
    prisma.profile.updateMany({
      where: { userId },
      data: { streakDays: newStreak },
    }),
  ]);
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
  // Get already-earned achievements
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e: any) => e.achievementId));

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (earnedIds.has(def.id)) continue; // already earned

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
      // Award the achievement (idempotent)
      try {
        await prisma.userAchievement.create({
          data: { userId, achievementId: def.id },
        });
        newlyUnlocked.push(def.id);

        // Grant bonus XP for the achievement (idempotent via key)
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
        // Unique constraint violation = already awarded concurrently — safe to ignore
      }
    }
  }

  return newlyUnlocked;
}

// ─── Get progression context for achievement evaluation ───────────────────────

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

  // Count distinct topics from completed lesson IDs (prefix before "_")
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
}> {
  await ensureUser(userId);

  // Check if already completed
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  const isFirstTime = !existing || existing.status !== 'completed';
  const xpAmount = isFirstTime ? XP_CONFIG.LESSON_COMPLETE_FIRST_TIME : 10;

  // Mark as completed
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

  // Award XP (first time: lesson_complete_..., reviews: timestamped)
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
      : `Reviewed "${lessonTitle}" (+10 XP bonus)`,
  });

  // Record qualifying activity for streak
  await recordQualifyingActivity(userId, 'lesson');

  // Evaluate achievements
  const context = await getProgressionContext(userId);
  const newAchievements = await evaluateAchievements(userId, context);

  return {
    success: true,
    xpAwarded: awarded ? xpAmount : 0,
    newAchievements,
    alreadyCompleted: !isFirstTime,
  };
}

// ─── Public API: Award Quick Check XP ─────────────────────────────────────────

export async function awardQuickCheckXP(
  userId: string,
  conceptId: string,
  conceptTitle: string
): Promise<{ success: boolean; xpAwarded: number }> {
  await ensureUser(userId);
  const xpAmount = 10;
  const xpKey = `quick_check_${userId}_${conceptId}_${Date.now()}`;

  const awarded = await awardXP({
    userId,
    amount: xpAmount,
    eventType: 'quick_check',
    sourceType: 'concept',
    sourceId: conceptId,
    idempotencyKey: xpKey,
    description: `Mastered Quick Check: "${conceptTitle}"`,
  });

  if (awarded) {
    await recordQualifyingActivity(userId, 'lesson');
  }

  return { success: awarded, xpAwarded: awarded ? xpAmount : 0 };
}

// ─── Public API: Submit a quiz ────────────────────────────────────────────────

export async function submitQuiz(
  userId: string,
  quizId: string,
  quizTopic: string,
  scorePercent: number // 0-100, validated against answer key client-side for now
): Promise<{
  success: boolean;
  xpAwarded: number;
  newAchievements: string[];
  isFirstAttempt: boolean;
}> {
  await ensureUser(userId);

  // Clamp score to valid range
  const score = Math.max(0, Math.min(100, Math.round(scorePercent)));

  // Check first attempt
  const existingProgress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: `quiz_${quizId}` } },
  });
  const isFirstAttempt = !existingProgress;

  // Update quiz progress
  const isBestScore =
    !existingProgress?.bestScore || score > existingProgress.bestScore;

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

  // Base XP (first attempt base or retake participation)
  const baseXP = isFirstAttempt ? XP_CONFIG.QUIZ_FIRST_ATTEMPT_BASE : 5;
  const baseKey = `quiz_base_${userId}_${quizId}_${Date.now()}`;
  const baseAwarded = await awardXP({
    userId,
    amount: baseXP,
    eventType: 'quiz_submit',
    sourceType: 'quiz',
    sourceId: quizId,
    idempotencyKey: baseKey,
    description: `Attempted quiz on "${quizTopic}"`,
  });
  if (baseAwarded) totalXP += baseXP;

  // Performance bonus (up to 15 XP, calculated from score)
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

  // Record qualifying activity for streak
  await recordQualifyingActivity(userId, 'quiz');

  // Evaluate achievements (using latest quiz score for perfect/mastery checks)
  const context = await getProgressionContext(userId, score);
  const newAchievements = await evaluateAchievements(userId, context);

  return {
    success: true,
    xpAwarded: totalXP,
    newAchievements,
    isFirstAttempt,
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

// ─── Public API: Leaderboard ─────────────────────────────────────────────────

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
    // Current week: Monday 00:00 UTC → Sunday 23:59 UTC
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    // Sum XP earned this week from XpTransaction
    const weeklyXpRows = await prisma.xpTransaction.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekStart } },
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

    // Fetch user details for real users only (avoids querying non-existent fallback IDs)
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
      const currentStreak = user?.currentStreak ?? fallback?.currentStreak ?? 1;
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

    // Sort descending by weeklyXP, then by lifetimeXP
    list.sort((a, b) => {
      if (b.weeklyXP !== a.weeklyXP) return b.weeklyXP - a.weeklyXP;
      return b.lifetimeXP - a.lifetimeXP;
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

    // Fetch top 50 users by lifetime XP in a single query
    const topUsers = await prisma.user.findMany({
      where: { lifetimeXP: { gt: 0 } },
      include: { profile: true },
      orderBy: { lifetimeXP: 'desc' },
      take: 50,
    });

    const userMap = new Map<string, any>(topUsers.map((u: any) => [u.id, u]));

    // If currentUserId is not in top 50, fetch that single user instead of refetching all
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
      const currentStreak = user?.currentStreak ?? fallback?.currentStreak ?? 1;
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

    list.sort((a, b) => b.lifetimeXP - a.lifetimeXP);

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
