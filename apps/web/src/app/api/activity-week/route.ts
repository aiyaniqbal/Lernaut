import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/activity-week?userId=...
 * Returns YYYY-MM-DD strings for all recent qualifying activity dates.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        qualifyingActivityCount: { gt: 0 },
      },
      select: { localActivityDate: true },
      orderBy: { localActivityDate: 'desc' },
      take: 14,
    });

    return NextResponse.json(activities.map((a) => a.localActivityDate));
  } catch (err) {
    console.error('activity-week error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
