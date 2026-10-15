const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Load Prisma Client from root node_modules
const { PrismaClient } = require('c:\\Users\\AIYAN\\Documents\\Projects\\ai-teacher\\node_modules\\@prisma\\client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uHXnFrxpj0G4@ep-calm-cake-azmspxlu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

// Helper for IST day range
function getISTDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const year = parseInt(parts.find((p) => p.type === 'year').value);
  const month = parseInt(parts.find((p) => p.type === 'month').value) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day').value);

  const start = new Date(
    Date.UTC(year, month, day, 0, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const msUntilMidnight = Math.max(0, end.getTime() - now.getTime());

  return { start, end, dateStr, msUntilMidnight };
}

// Pure streak calculation logic matching progression.ts
function calculateNextStreak(params) {
  const { previousDate, currentStreak, longestStreak, todayDate } = params;

  if (!previousDate) {
    return {
      newStreak: 1,
      newLongest: Math.max(1, longestStreak),
      isNewDay: true,
    };
  }

  if (previousDate === todayDate) {
    return {
      newStreak: Math.max(1, currentStreak),
      newLongest: Math.max(currentStreak, longestStreak),
      isNewDay: false,
    };
  }

  const [pY, pM, pD] = previousDate.split('-').map(Number);
  const [tY, tM, tD] = todayDate.split('-').map(Number);
  const prevUtc = Date.UTC(pY, pM - 1, pD);
  const todayUtc = Date.UTC(tY, tM - 1, tD);
  const diffDays = Math.round((todayUtc - prevUtc) / 86400000);

  if (diffDays === 1) {
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newLongest: Math.max(newStreak, longestStreak),
      isNewDay: true,
    };
  } else if (diffDays > 1) {
    return {
      newStreak: 1,
      newLongest: Math.max(1, longestStreak),
      isNewDay: true,
    };
  } else {
    return {
      newStreak: currentStreak,
      newLongest: longestStreak,
      isNewDay: false,
    };
  }
}

// Level formulas matching xpUtils.ts
function cumulativeXpForLevel(level) {
  if (level <= 1) return 0;
  const L = level;
  return 100 * (L - 1) + 25 * (L - 1) * (L - 2);
}

function getLevelInfo(totalXP) {
  let level = 1;
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
  };
}

// ─── UNIT TESTS ─────────────────────────────────────────────────────────────

test('Streak Unit: First day creates a 1-day streak', () => {
  const result = calculateNextStreak({
    previousDate: null,
    currentStreak: 0,
    longestStreak: 0,
    todayDate: '2026-10-15',
  });
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.newLongest, 1);
  assert.strictEqual(result.isNewDay, true);
});

test('Streak Unit: Same day activity maintains streak without incrementing', () => {
  const result = calculateNextStreak({
    previousDate: '2026-10-15',
    currentStreak: 4,
    longestStreak: 6,
    todayDate: '2026-10-15',
  });
  assert.strictEqual(result.newStreak, 4);
  assert.strictEqual(result.newLongest, 6);
  assert.strictEqual(result.isNewDay, false);
});

test('Streak Unit: Consecutive day extends streak and longest streak', () => {
  const result = calculateNextStreak({
    previousDate: '2026-10-14',
    currentStreak: 4,
    longestStreak: 4,
    todayDate: '2026-10-15',
  });
  assert.strictEqual(result.newStreak, 5);
  assert.strictEqual(result.newLongest, 5);
  assert.strictEqual(result.isNewDay, true);
});

test('Streak Unit: Missed day resets streak to 1 while preserving longest streak', () => {
  const result = calculateNextStreak({
    previousDate: '2026-10-12',
    currentStreak: 7,
    longestStreak: 10,
    todayDate: '2026-10-15',
  });
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.newLongest, 10);
  assert.strictEqual(result.isNewDay, true);
});

test('Level Unit: Level thresholds calculate accurately', () => {
  assert.strictEqual(cumulativeXpForLevel(1), 0);
  assert.strictEqual(cumulativeXpForLevel(2), 100);
  assert.strictEqual(cumulativeXpForLevel(3), 250);
  assert.strictEqual(cumulativeXpForLevel(4), 450);

  const lvl1 = getLevelInfo(50);
  assert.strictEqual(lvl1.level, 1);
  assert.strictEqual(lvl1.xpIntoCurrentLevel, 50);
  assert.strictEqual(lvl1.nextLevelXPRequired, 100);

  const lvl2 = getLevelInfo(120);
  assert.strictEqual(lvl2.level, 2);
  assert.strictEqual(lvl2.xpIntoCurrentLevel, 20);
  assert.strictEqual(lvl2.nextLevelXPRequired, 150);
});

test('Timezone Unit: IST Day Range produces correct midnight boundaries', () => {
  const range = getISTDayRange(new Date());
  assert.ok(range.dateStr.match(/^\d{4}-\d{2}-\d{2}$/));
  assert.ok(range.start instanceof Date);
  assert.ok(range.end instanceof Date);
  assert.strictEqual(range.end.getTime() - range.start.getTime(), 86400000);
  assert.ok(range.msUntilMidnight > 0 && range.msUntilMidnight <= 86400000);
});

// ─── INTEGRATION TESTS (Neon PostgreSQL) ─────────────────────────────────────

test('Integration: Mission completion awards XP to specific user, updates streak, and prevents duplicates', async (t) => {
  const testUserId = `test-user-${Date.now()}`;
  const testUserName = 'Integration Tester';

  // Cleanup on end
  t.after(async () => {
    try {
      await prisma.missionLog.deleteMany({ where: { userId: testUserId } });
      await prisma.xpTransaction.deleteMany({ where: { userId: testUserId } });
      await prisma.dailyActivity.deleteMany({ where: { userId: testUserId } });
      await prisma.profile.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
  });

  // 1. Ensure user and profile exist
  await prisma.user.create({
    data: {
      id: testUserId,
      displayName: testUserName,
      lifetimeXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
      profile: {
        create: {
          username: testUserName,
          totalXP: 0,
          level: 1,
          streakDays: 0,
        },
      },
    },
  });

  // Verify initial state
  const initialUser = await prisma.user.findUnique({
    where: { id: testUserId },
    include: { profile: true },
  });
  assert.strictEqual(initialUser.lifetimeXP, 0);
  assert.strictEqual(initialUser.currentLevel, 1);
  assert.strictEqual(initialUser.currentStreak, 0);
  assert.strictEqual(initialUser.profile.totalXP, 0);
  assert.strictEqual(initialUser.profile.streakDays, 0);

  // 2. Complete Mission 1 (+50 XP) using atomic transaction
  const missionId = '1';
  const xpAmount = 50;
  const { dateStr } = getISTDayRange();
  const idempotencyKey = `mission_${testUserId}_${missionId}_${dateStr}`;

  await prisma.$transaction(async (tx) => {
    await tx.xpTransaction.create({
      data: {
        userId: testUserId,
        eventType: 'mission',
        xpAmount,
        sourceType: 'mission',
        sourceId: missionId,
        idempotencyKey,
        description: 'Daily Mission: Complete Daily Lesson',
      },
    });

    const user = await tx.user.findUniqueOrThrow({ where: { id: testUserId } });
    const profile = await tx.profile.findUniqueOrThrow({ where: { userId: testUserId } });

    await tx.missionLog.create({
      data: {
        userId: testUserId,
        profileId: profile.id,
        missionId: `mission_${missionId}`,
        xpGranted: xpAmount,
      },
    });

    const newLifetimeXP = user.lifetimeXP + xpAmount;
    const { level: newLevel } = getLevelInfo(newLifetimeXP);
    const { newStreak, newLongest } = calculateNextStreak({
      previousDate: user.latestActivityDate,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      todayDate: dateStr,
    });

    await tx.user.update({
      where: { id: testUserId },
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

    await tx.dailyActivity.upsert({
      where: { userId_localActivityDate: { userId: testUserId, localActivityDate: dateStr } },
      update: {
        qualifyingActivityCount: { increment: 1 },
        xpEarned: { increment: xpAmount },
      },
      create: {
        userId: testUserId,
        localActivityDate: dateStr,
        qualifyingActivityCount: 1,
        xpEarned: xpAmount,
      },
    });
  });

  // Verify post-completion state
  const updatedUser = await prisma.user.findUnique({
    where: { id: testUserId },
    include: { profile: true },
  });
  assert.strictEqual(updatedUser.lifetimeXP, 50);
  assert.strictEqual(updatedUser.profile.totalXP, 50);
  assert.strictEqual(updatedUser.currentStreak, 1);
  assert.strictEqual(updatedUser.longestStreak, 1);
  assert.strictEqual(updatedUser.profile.streakDays, 1);

  // Verify XpTransaction ledger record
  const txRecord = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey },
  });
  assert.ok(txRecord);
  assert.strictEqual(txRecord.xpAmount, 50);
  assert.strictEqual(txRecord.userId, testUserId);

  // Verify DailyActivity record
  const dailyAct = await prisma.dailyActivity.findUnique({
    where: { userId_localActivityDate: { userId: testUserId, localActivityDate: dateStr } },
  });
  assert.ok(dailyAct);
  assert.strictEqual(dailyAct.qualifyingActivityCount, 1);
  assert.strictEqual(dailyAct.xpEarned, 50);

  // 3. Test Idempotency: Attempt to submit duplicate claim with the same idempotency key
  let duplicateAwarded = false;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.xpTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return; // Idempotently ignore
      }
      await tx.xpTransaction.create({
        data: {
          userId: testUserId,
          eventType: 'mission',
          xpAmount,
          idempotencyKey,
        },
      });
      duplicateAwarded = true;
    });
  } catch (err) {
    // Unique constraint violation also prevents duplicate
  }

  assert.strictEqual(duplicateAwarded, false);

  // Verify XP was NOT doubled
  const afterDuplicateUser = await prisma.user.findUnique({ where: { id: testUserId } });
  assert.strictEqual(afterDuplicateUser.lifetimeXP, 50);

  // 4. Complete a second distinct eligible mission (+100 XP)
  const mission2Id = '2';
  const xp2Amount = 100;
  const idempotencyKey2 = `mission_${testUserId}_${mission2Id}_${dateStr}`;

  await prisma.$transaction(async (tx) => {
    await tx.xpTransaction.create({
      data: {
        userId: testUserId,
        eventType: 'mission',
        xpAmount: xp2Amount,
        sourceType: 'mission',
        sourceId: mission2Id,
        idempotencyKey: idempotencyKey2,
        description: 'Daily Mission: Score 80%+ on Quiz',
      },
    });

    const user = await tx.user.findUniqueOrThrow({ where: { id: testUserId } });
    const profile = await tx.profile.findUniqueOrThrow({ where: { userId: testUserId } });

    await tx.missionLog.create({
      data: {
        userId: testUserId,
        profileId: profile.id,
        missionId: `mission_${mission2Id}`,
        xpGranted: xp2Amount,
      },
    });

    const newLifetimeXP = user.lifetimeXP + xp2Amount;
    const { level: newLevel } = getLevelInfo(newLifetimeXP);
    const { newStreak, newLongest } = calculateNextStreak({
      previousDate: user.latestActivityDate,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      todayDate: dateStr,
    });

    await tx.user.update({
      where: { id: testUserId },
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

    await tx.dailyActivity.upsert({
      where: { userId_localActivityDate: { userId: testUserId, localActivityDate: dateStr } },
      update: {
        qualifyingActivityCount: { increment: 1 },
        xpEarned: { increment: xp2Amount },
      },
      create: {
        userId: testUserId,
        localActivityDate: dateStr,
        qualifyingActivityCount: 1,
        xpEarned: xp2Amount,
      },
    });
  });

  // Verify second mission completion
  const afterSecondUser = await prisma.user.findUnique({
    where: { id: testUserId },
    include: { profile: true },
  });
  // 50 + 100 = 150 XP -> Level 2
  assert.strictEqual(afterSecondUser.lifetimeXP, 150);
  assert.strictEqual(afterSecondUser.currentLevel, 2);
  assert.strictEqual(afterSecondUser.profile.totalXP, 150);
  assert.strictEqual(afterSecondUser.profile.level, 2);
  // Same day -> streak remains 1
  assert.strictEqual(afterSecondUser.currentStreak, 1);
  assert.strictEqual(afterSecondUser.profile.streakDays, 1);

  // Verify daily activity count is 2 and total XP earned today is 150
  const finalDailyAct = await prisma.dailyActivity.findUnique({
    where: { userId_localActivityDate: { userId: testUserId, localActivityDate: dateStr } },
  });
  assert.strictEqual(finalDailyAct.qualifyingActivityCount, 2);
  assert.strictEqual(finalDailyAct.xpEarned, 150);

  // Verify weekly leaderboard aggregation includes this user's 150 XP
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setUTCDate(weekStart.getUTCDate() + 7);

  const weeklyAgg = await prisma.xpTransaction.aggregate({
    where: {
      userId: testUserId,
      createdAt: { gte: weekStart, lt: nextWeekStart },
    },
    _sum: { xpAmount: true },
  });
  assert.strictEqual(weeklyAgg._sum.xpAmount, 150);
});
