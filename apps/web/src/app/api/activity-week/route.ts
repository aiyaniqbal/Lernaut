import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/activity-week?userId=...
 * Returns YYYY-MM-DD strings for activity dates in the current week Mon-Sun.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Calculate current week Mon-Sun in UTC
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const dates: string[] = [];
  for (let i = 0; i <= daysFromMonday; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - daysFromMonday + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  try {
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        localActivityDate: { in: dates },
        qualifyingActivityCount: { gt: 0 },
      },
      select: { localActivityDate: true },
    });

    return NextResponse.json(activities.map((a) => a.localActivityDate));
  } catch (err) {
    console.error('activity-week error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
