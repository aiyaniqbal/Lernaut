/**
 * Central achievement registry.
 * These are seeded into the Achievement table once and referenced by ID.
 * Adding a new achievement = adding one entry here + running seedAchievements().
 */

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: string;
  iconKey: string; // emoji shorthand
  xpBonus: number;
  criteria: {
    type:
      | 'lesson_count'
      | 'quiz_count'
      | 'streak_days'
      | 'perfect_quiz'
      | 'topic_count'
      | 'lifetime_xp'
      | 'mastery_score'
      | 'active_days';
    threshold: number;
  };
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your very first lesson.',
    category: 'lessons',
    iconKey: '👣',
    xpBonus: 25,
    criteria: { type: 'lesson_count', threshold: 1 },
  },
  {
    id: 'quiz_starter',
    title: 'Quiz Starter',
    description: 'Complete 5 quizzes.',
    category: 'quizzes',
    iconKey: '📝',
    xpBonus: 50,
    criteria: { type: 'quiz_count', threshold: 5 },
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Earn 100% on a quiz.',
    category: 'quizzes',
    iconKey: '💯',
    xpBonus: 30,
    criteria: { type: 'perfect_quiz', threshold: 100 },
  },
  {
    id: 'learning_explorer',
    title: 'Learning Explorer',
    description: 'Complete 10 distinct lessons.',
    category: 'lessons',
    iconKey: '🔭',
    xpBonus: 50,
    criteria: { type: 'lesson_count', threshold: 10 },
  },
  {
    id: 'on_a_roll',
    title: 'On a Roll',
    description: 'Reach a 3-day streak.',
    category: 'streak',
    iconKey: '🔥',
    xpBonus: 30,
    criteria: { type: 'streak_days', threshold: 3 },
  },
  {
    id: 'consistency_champion',
    title: 'Consistency Champion',
    description: 'Reach a 7-day streak.',
    category: 'streak',
    iconKey: '⚡',
    xpBonus: 100,
    criteria: { type: 'streak_days', threshold: 7 },
  },
  {
    id: 'monthly_momentum',
    title: 'Monthly Momentum',
    description: 'Learn on 20 distinct days.',
    category: 'streak',
    iconKey: '📅',
    xpBonus: 150,
    criteria: { type: 'active_days', threshold: 20 },
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Study 5 distinct topics.',
    category: 'lessons',
    iconKey: '📚',
    xpBonus: 75,
    criteria: { type: 'topic_count', threshold: 5 },
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Earn 1,000 lifetime XP.',
    category: 'xp',
    iconKey: '🎓',
    xpBonus: 100,
    criteria: { type: 'lifetime_xp', threshold: 1000 },
  },
  {
    id: 'mastery_milestone',
    title: 'Mastery Milestone',
    description: 'Score 90%+ on a quiz.',
    category: 'quizzes',
    iconKey: '🏆',
    xpBonus: 75,
    criteria: { type: 'mastery_score', threshold: 90 },
  },
];
