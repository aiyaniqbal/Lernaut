const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uHXnFrxpj0G4@ep-calm-cake-azmspxlu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

const ACHIEVEMENTS = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your very first lesson.',
    category: 'lessons',
    iconKey: '👣',
    xpBonus: 25,
    criteria: JSON.stringify({ type: 'lesson_count', threshold: 1 }),
  },
  {
    id: 'quiz_starter',
    title: 'Quiz Starter',
    description: 'Complete 5 quizzes.',
    category: 'quizzes',
    iconKey: '📝',
    xpBonus: 50,
    criteria: JSON.stringify({ type: 'quiz_count', threshold: 5 }),
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Earn 100% on a quiz.',
    category: 'quizzes',
    iconKey: '💯',
    xpBonus: 30,
    criteria: JSON.stringify({ type: 'perfect_quiz', threshold: 100 }),
  },
  {
    id: 'learning_explorer',
    title: 'Learning Explorer',
    description: 'Complete 10 distinct lessons.',
    category: 'lessons',
    iconKey: '🔭',
    xpBonus: 50,
    criteria: JSON.stringify({ type: 'lesson_count', threshold: 10 }),
  },
  {
    id: 'on_a_roll',
    title: 'On a Roll',
    description: 'Reach a 3-day streak.',
    category: 'streak',
    iconKey: '🔥',
    xpBonus: 30,
    criteria: JSON.stringify({ type: 'streak_days', threshold: 3 }),
  },
  {
    id: 'consistency_champion',
    title: 'Consistency Champion',
    description: 'Reach a 7-day streak.',
    category: 'streak',
    iconKey: '⚡',
    xpBonus: 100,
    criteria: JSON.stringify({ type: 'streak_days', threshold: 7 }),
  },
  {
    id: 'monthly_momentum',
    title: 'Monthly Momentum',
    description: 'Learn on 20 distinct days.',
    category: 'streak',
    iconKey: '📅',
    xpBonus: 150,
    criteria: JSON.stringify({ type: 'active_days', threshold: 20 }),
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Study 5 distinct topics.',
    category: 'lessons',
    iconKey: '📚',
    xpBonus: 75,
    criteria: JSON.stringify({ type: 'topic_count', threshold: 5 }),
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Earn 1,000 lifetime XP.',
    category: 'xp',
    iconKey: '🎓',
    xpBonus: 100,
    criteria: JSON.stringify({ type: 'lifetime_xp', threshold: 1000 }),
  },
  {
    id: 'mastery_milestone',
    title: 'Mastery Milestone',
    description: 'Score 90%+ on a quiz.',
    category: 'quizzes',
    iconKey: '🏆',
    xpBonus: 75,
    criteria: JSON.stringify({ type: 'mastery_score', threshold: 90 }),
  },
];

const COMMUNITY_USERS = [
  {
    id: 'user-community-1',
    displayName: 'Aarav Sharma',
    username: 'aarav_ai',
    lifetimeXP: 2450,
    currentLevel: 8,
    currentStreak: 12,
    longestStreak: 14,
    weeklyXP: 520,
  },
  {
    id: 'user-community-2',
    displayName: 'Zara Chen',
    username: 'zara_learns',
    lifetimeXP: 1980,
    currentLevel: 7,
    currentStreak: 8,
    longestStreak: 10,
    weeklyXP: 440,
  },
  {
    id: 'user-community-3',
    displayName: 'Leo Martinez',
    username: 'leo_space',
    lifetimeXP: 1620,
    currentLevel: 6,
    currentStreak: 6,
    longestStreak: 9,
    weeklyXP: 375,
  },
  {
    id: 'user-community-4',
    displayName: 'Priya Patel',
    username: 'priya_scholar',
    lifetimeXP: 1250,
    currentLevel: 5,
    currentStreak: 5,
    longestStreak: 7,
    weeklyXP: 310,
  },
  {
    id: 'user-community-5',
    displayName: 'Elena Rostova',
    username: 'elena_r',
    lifetimeXP: 980,
    currentLevel: 4,
    currentStreak: 4,
    longestStreak: 6,
    weeklyXP: 250,
  },
  {
    id: 'user-community-6',
    displayName: 'David Kim',
    username: 'dkim_learn',
    lifetimeXP: 750,
    currentLevel: 3,
    currentStreak: 3,
    longestStreak: 5,
    weeklyXP: 190,
  },
];

async function seed() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed Achievements
  console.log('1. Seeding Achievements...');
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: {
        title: ach.title,
        description: ach.description,
        category: ach.category,
        iconKey: ach.iconKey,
        criteria: ach.criteria,
        xpBonus: ach.xpBonus,
        isActive: true,
      },
      create: {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        category: ach.category,
        iconKey: ach.iconKey,
        criteria: ach.criteria,
        xpBonus: ach.xpBonus,
        isActive: true,
      },
    });
  }
  console.log(`   Seeded ${ACHIEVEMENTS.length} achievements.`);

  // 2. Seed Community Users & Profiles
  console.log('2. Seeding Community Users...');
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  for (const u of COMMUNITY_USERS) {
    const user = await prisma.user.upsert({
      where: { id: u.id },
      update: {
        displayName: u.displayName,
        lifetimeXP: u.lifetimeXP,
        currentLevel: u.currentLevel,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        latestActivityDate: todayIso,
      },
      create: {
        id: u.id,
        displayName: u.displayName,
        lifetimeXP: u.lifetimeXP,
        currentLevel: u.currentLevel,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        latestActivityDate: todayIso,
      },
    });

    // Profile
    await prisma.profile.upsert({
      where: { userId: u.id },
      update: {
        username: u.username,
        totalXP: u.lifetimeXP,
        level: u.currentLevel,
        streakDays: u.currentStreak,
      },
      create: {
        userId: u.id,
        username: u.username,
        totalXP: u.lifetimeXP,
        level: u.currentLevel,
        streakDays: u.currentStreak,
      },
    });

    // XP Transactions (for weekly leaderboard aggregation)
    const idempotencyKey = `seed-weekly-xp-${u.id}-${todayIso}`;
    await prisma.xpTransaction.upsert({
      where: { idempotencyKey },
      update: { xpAmount: u.weeklyXP },
      create: {
        idempotencyKey,
        userId: u.id,
        eventType: 'lesson_complete',
        xpAmount: u.weeklyXP,
        sourceType: 'lesson',
        description: `Weekly lesson completions for ${u.displayName}`,
        createdAt: new Date(),
      },
    });

    // Daily Activities (for past 3 days)
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const d = new Date(now.getTime() - dayOffset * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      await prisma.dailyActivity.upsert({
        where: {
          userId_localActivityDate: {
            userId: u.id,
            localActivityDate: dateStr,
          },
        },
        update: {
          qualifyingActivityCount: 3,
          lessonsCompleted: 2,
          quizzesCompleted: 1,
          xpEarned: Math.floor(u.weeklyXP / 3),
        },
        create: {
          userId: u.id,
          localActivityDate: dateStr,
          qualifyingActivityCount: 3,
          lessonsCompleted: 2,
          quizzesCompleted: 1,
          xpEarned: Math.floor(u.weeklyXP / 3),
        },
      });
    }

    // User Achievements
    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId: u.id,
          achievementId: 'first_steps',
        },
      },
      update: {},
      create: {
        userId: u.id,
        achievementId: 'first_steps',
      },
    });

    // Sample LessonProgress
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: u.id,
          lessonId: 'lesson-welcome-ai',
        },
      },
      update: {
        status: 'completed',
        attempts: 1,
        bestScore: 95,
        completedAt: new Date(),
      },
      create: {
        userId: u.id,
        lessonId: 'lesson-welcome-ai',
        status: 'completed',
        attempts: 1,
        bestScore: 95,
        completedAt: new Date(),
      },
    });
  }
  console.log(`   Seeded ${COMMUNITY_USERS.length} community users with profiles, XP transactions, daily activities, and progress.`);

  // 3. Ensure Default Learner User exists
  console.log('3. Seeding Default Active User (Learner)...');
  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-learner-001' },
    update: {},
    create: {
      id: 'default-learner-001',
      displayName: 'Aiyan Learner',
      lifetimeXP: 320,
      currentLevel: 2,
      currentStreak: 3,
      longestStreak: 3,
      latestActivityDate: todayIso,
    },
  });

  await prisma.profile.upsert({
    where: { userId: defaultUser.id },
    update: {},
    create: {
      userId: defaultUser.id,
      username: 'aiyan_learner',
      totalXP: 320,
      level: 2,
      streakDays: 3,
    },
  });

  await prisma.xpTransaction.upsert({
    where: { idempotencyKey: `seed-user-xp-${defaultUser.id}` },
    update: {},
    create: {
      idempotencyKey: `seed-user-xp-${defaultUser.id}`,
      userId: defaultUser.id,
      eventType: 'lesson_complete',
      xpAmount: 180,
      sourceType: 'lesson',
      description: "Completed 'Welcome to AI-Powered Learning'",
      createdAt: new Date(),
    },
  });

  console.log('--- Database Seeding Complete Successfully! ---');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
