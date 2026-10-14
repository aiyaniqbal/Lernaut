'use server';

/**
 * Legacy XP actions — kept for TaskManager backward compatibility.
 * New code should use src/app/actions/progression.ts instead.
 */

import { prisma } from '../../lib/prisma';
import { getLevelInfo, getISTDayRange } from '../../utils/xpUtils';

/**
 * Fetches the list of mission IDs completed today (resets at 12:00 AM IST).
 */
export async function getCompletedMissionsToday(): Promise<{
  completedMissions: string[];
  msUntilReset: number;
  dateStr: string;
}> {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return { completedMissions: [], msUntilReset: 0, dateStr: '' };

    const { start, end, dateStr, msUntilMidnight } = getISTDayRange();

    const logs = await prisma.missionLog.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: { missionId: true },
    });

    const completed = Array.from(new Set(logs.map((l) => l.missionId)));
    return {
      completedMissions: completed,
      msUntilReset: msUntilMidnight,
      dateStr,
    };
  } catch (error) {
    console.error('Failed to get completed missions:', error);
    return { completedMissions: [], msUntilReset: 0, dateStr: '' };
  }
}

/**
 * Grants XP to the current user (legacy path for TaskManager missions).
 * Enforces single-claim per day, resetting at 12:00 AM midnight IST.
 */
export async function addXp(amount: number, source: string) {
  try {
    // Get or create the first user (legacy single-user mode for TaskManager)
    let user = await prisma.user.findFirst({
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          displayName: 'Learner',
          profile: {
            create: {
              username: 'Learner',
              totalXP: 0,
              level: 1,
              streakDays: 0,
            },
          },
        },
        include: { profile: true },
      });
    }

    if (!user.profile) {
      // Create profile if missing
      await prisma.profile.create({
        data: {
          userId: user.id,
          username: 'Learner',
          totalXP: 0,
          level: 1,
          streakDays: 0,
        },
      });
      const refreshed = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      if (!refreshed?.profile) throw new Error('User has no profile.');
      user = refreshed as typeof user;
    }

    // Check if mission was already completed today in IST (resets at 12:00 AM midnight IST)
    const { start, end, dateStr } = getISTDayRange();
    const alreadyDone = await prisma.missionLog.findFirst({
      where: {
        userId: user.id,
        missionId: source,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    if (alreadyDone) {
      return {
        success: false,
        alreadyCompleted: true,
        message: `This mission has already been completed today. Resets at 12:00 AM midnight IST.`,
      };
    }

    // Add XP transaction (legacy MissionLog)
    const mission = await prisma.missionLog.create({
      data: {
        profileId: user.profile!.id,
        userId: user.id,
        missionId: source,
        xpGranted: amount,
      },
    });

    // Also record into canonical XpTransaction ledger with unique per-day idempotency key
    const idempotencyKey = `mission_${user.id}_${source}_${dateStr}`;
    await prisma.xpTransaction.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        userId: user.id,
        eventType: 'mission',
        xpAmount: amount,
        sourceType: 'mission',
        sourceId: source,
        idempotencyKey,
        description: `Daily Mission: ${source}`,
      },
    });

    // Update total XP and level
    const newXP = user.profile!.totalXP + amount;
    const { level: newLevel } = getLevelInfo(newXP);

    await prisma.profile.update({
      where: { id: user.profile!.id },
      data: { totalXP: newXP, level: newLevel },
    });

    // Also update canonical User record and sync displayName with profile
    const displayName = user.profile?.username || user.displayName || 'Learner';
    await prisma.user.update({
      where: { id: user.id },
      data: { lifetimeXP: newXP, currentLevel: newLevel, displayName },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add XP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the current user's profile (used by DailyGoal component).
 */
export async function getProfile(userId?: string) {
  try {
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
    }
    if (!user) {
      user = await prisma.user.findFirst({
        include: { profile: true },
      });
    }
    return user?.profile || null;
  } catch (e) {
    console.warn('Could not fetch profile:', e);
    return null;
  }
}
