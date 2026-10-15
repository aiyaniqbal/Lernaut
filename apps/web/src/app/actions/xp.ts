'use server';

/**
 * Legacy XP actions — kept for backward compatibility.
 * Modern code imports from src/app/actions/progression.ts.
 */

import { prisma } from '../../lib/prisma';
import {
  getCompletedMissionsToday as getMissionsTodayAction,
  completeMission,
} from './progression';

/**
 * Fetches the list of mission IDs completed today (resets at 12:00 AM IST).
 * Scoped to the provided userId.
 */
export async function getCompletedMissionsToday(userId?: string): Promise<{
  completedMissions: string[];
  msUntilReset: number;
  dateStr: string;
}> {
  return getMissionsTodayAction(userId);
}

/**
 * Grants XP to the current user.
 * Enforces single-claim per day, resetting at 12:00 AM midnight IST.
 */
export async function addXp(amount: number, source: string, userId?: string) {
  if (userId) {
    const res = await completeMission(userId, source, amount);
    return res;
  }

  console.warn(
    '[xp.ts] addXp called without userId. To prevent cross-user leakage, userId is required.'
  );
  return {
    success: false,
    error: 'userId is required to add XP.',
  };
}

/**
 * Fetches the user's profile (used by legacy components).
 */
export async function getProfile(userId?: string) {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    return user?.profile || null;
  } catch (e) {
    console.warn('Could not fetch profile for user:', userId, e);
    return null;
  }
}
