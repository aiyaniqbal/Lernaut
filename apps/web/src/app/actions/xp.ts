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
import { getAuthenticatedLearner } from './auth';

/**
 * Fetches the list of mission IDs completed today (resets at 12:00 AM IST).
 * Scoped to the authenticated user.
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
 * Enforces authenticated session and single-claim per day, resetting at 12:00 AM midnight IST.
 */
export async function addXp(amount: number, source: string, userId?: string) {
  try {
    const authLearner = await getAuthenticatedLearner();
    if (userId && userId !== authLearner.learnerId) {
      return {
        success: false,
        error: 'FORBIDDEN: You cannot award XP for another user.',
      };
    }

    const res = await completeMission(authLearner.learnerId, source, amount);
    return res;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Authentication required to add XP.',
    };
  }
}

/**
 * Fetches the user's profile (used by legacy components).
 * Scoped strictly to the authenticated user.
 */
export async function getProfile(userId?: string) {
  try {
    const authLearner = await getAuthenticatedLearner();
    if (userId && userId !== authLearner.learnerId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: authLearner.learnerId },
      include: { profile: true },
    });
    return user?.profile || null;
  } catch (e) {
    return null;
  }
}
