import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/activity-week?userId=...
 * Returns YYYY-MM-DD strings for all recent qualifying activity dates.
 * Enforces fail-closed authentication and user ownership.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await prisma.authUser.findUnique({
      where: { id: session.user.id },
      select: { learnerId: true, emailVerified: true },
    });

    if (!authUser || !authUser.emailVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestedUserId = req.nextUrl.searchParams.get('userId');
    if (requestedUserId && requestedUserId !== authUser.learnerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = authUser.learnerId;
    if (!targetUserId) {
      return NextResponse.json([], { status: 200 });
    }

    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId: targetUserId,
        qualifyingActivityCount: { gt: 0 },
      },
      select: { localActivityDate: true },
      orderBy: { localActivityDate: 'desc' },
      take: 14,
    });

    return NextResponse.json(activities.map((a) => a.localActivityDate));
  } catch (err) {
    console.error('activity-week error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
