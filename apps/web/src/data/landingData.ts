/**
 * Lernaut Brand & Landing Page Data Configuration
 * Official Brand Name: Lernaut
 * Tagline: Your Notes. Your AI Teacher. Your Next Level.
 */

export interface FounderInfo {
  name: string;
  role: string;
  bio: string;
  initials: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  detail: string;
}

export const BRAND_CONFIG = {
  name: 'Lernaut',
  tagline: 'Your Notes. Your AI Teacher. Your Next Level.',
  heroSubtitle:
    'Turn your study materials into personalized lessons, interactive quizzes, and learning quests designed around your pace and progress.',
  aboutUsHeadline: 'About Lernaut',
  aboutUsDescription:
    'Lernaut is built around a simple idea: learning should be personal, engaging, and rewarding. We bring AI-assisted teaching, interactive practice, and game-inspired progression together to help students make better use of their study materials and build consistent learning habits. Our goal is to make learning feel less overwhelming by bringing personalized explanations, structured practice, and visible progress into one connected experience.',
};

export const FOUNDERS: FounderInfo[] = [
  {
    name: 'Aiyan Iqbal',
    role: 'Founder & Lead Architect',
    bio: 'Full-stack software engineer and educational technology creator committed to reimagining study routines through personalized AI instruction, structured cognitive roadmaps, and sustainable gamification.',
    initials: 'AI',
  },
  {
    name: 'MD Shoaib Ansari',
    role: 'Co-founder & Product Lead',
    bio: 'Product strategist and technologist focused on user-centric learning workflows, student engagement mechanisms, and turning dense academic curricula into actionable, rewarding mastery paths.',
    initials: 'SA',
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Bring Your Notes',
    description: 'Students begin with their own supported learning materials.',
    detail: 'Upload lecture slides, textbook PDFs, or study notes. Lernaut indexes the concepts and extracts key learning points without altering your source material.',
  },
  {
    step: '02',
    title: 'Learn Your Way',
    description: 'AI helps produce explanations and personalized lessons grounded in the uploaded material.',
    detail: 'Interactive voice and text lectures adapt to your chosen language (English, Hindi, or Hinglish) and adjust explanation depth to match your current mastery level.',
  },
  {
    step: '03',
    title: 'Practice and Improve',
    description: 'Students test their understanding and review weaker concepts.',
    detail: 'Adaptive quizzes generate questions directly from your materials, identify specific conceptual gaps, and provide focused practice drills to reinforce memory.',
  },
  {
    step: '04',
    title: 'Track Your Progress',
    description: 'Students follow learning paths and earn progression rewards from legitimate activity.',
    detail: 'Level up your Scholar tier, build daily learning streaks, unlock achievements, and see tangible weekly growth on dynamic roadmaps and leaderboards.',
  },
];

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'ai-teacher',
    title: 'Personalized AI Teacher',
    description: 'Engage with an intelligent tutor that explains topics using analogies, visual boards, and real-time voice in English, Hindi, or Hinglish.',
    iconName: 'GraduationCap',
    badge: 'Interactive',
  },
  {
    id: 'notes-learning',
    title: 'Notes-Based Learning',
    description: 'All explanations and practice questions are grounded strictly in the study materials and textbooks you provide.',
    iconName: 'BookOpen',
    badge: 'Grounded RAG',
  },
  {
    id: 'quizzes',
    title: 'Interactive Quizzes',
    description: 'Test recall with adaptive multiple-choice and conceptual questions that automatically pin down weak areas for targeted revision.',
    iconName: 'CheckCircle2',
    badge: 'Adaptive',
  },
  {
    id: 'roadmaps',
    title: 'Structured Learning Paths',
    description: 'Navigate clear milestone-based paths with locked and unlocked nodes that guide you systematically from fundamentals to advanced mastery.',
    iconName: 'Compass',
    badge: 'Milestone Paths',
  },
  {
    id: 'xp-levels',
    title: 'XP and Scholar Levels',
    description: 'Earn legitimate experience points for every completed lesson, quick check, and quiz session as you level up your academic tier.',
    iconName: 'Sparkles',
    badge: 'Progression',
  },
  {
    id: 'streaks-achievements',
    title: 'Streaks and Achievements',
    description: 'Build consistent daily study habits and unlock verified badges for milestones like First Spark, Night Owl, and 7-Day Champion.',
    iconName: 'Award',
    badge: 'Habit Building',
  },
  {
    id: 'mastery-progress',
    title: 'Learning Progress & Mastery',
    description: 'Inspect detailed performance charts, topic breakdowns, and confidence indices to know exactly where you stand before exams.',
    iconName: 'BarChart3',
    badge: 'Deep Analytics',
  },
  {
    id: 'leaderboards',
    title: 'Community Leaderboards',
    description: 'Compete in friendly weekly leagues with fellow learners and stay motivated through visible peer progress.',
    iconName: 'Trophy',
    badge: 'Friendly Competition',
  },
];

export const VALUE_PILLARS = [
  {
    title: 'Passive Cramming vs. Active Mastery',
    before: 'Reading static textbooks with no feedback, forgetting concepts within 48 hours, and guessing what to review next.',
    after: 'Interactive voice explanations, instant checkpoint questions, and automatic weak-spot drills that cement long-term retention.',
  },
  {
    title: 'One-Size-Fits-All vs. Tailored Pacing',
    before: 'Generic video lectures that move either too fast or too slow, leaving foundational gaps unaddressed.',
    after: 'Adaptive pacing that pauses when you hesitate, provides intuitive analogies, and speaks in your preferred language.',
  },
  {
    title: 'Study Fatigue vs. Rewarding Momentum',
    before: 'Unstructured study sessions that feel like isolated chores with zero visible sense of accomplishment.',
    after: 'Gamified progression with XP, Scholar tiers, daily quests, and milestone nodes that make each session feel like a win.',
  },
];

export const PIPELINE_STEPS = [
  {
    step: '1',
    label: 'Upload Notes',
    description: 'Drop PDF lecture notes or syllabus guides',
    icon: 'UploadCloud',
  },
  {
    step: '2',
    label: 'Personalized Lesson',
    description: 'AI constructs adapted interactive lecture segments',
    icon: 'Sparkles',
  },
  {
    step: '3',
    label: 'Practice Quiz',
    description: 'Instant quick-checks test immediate concept recall',
    icon: 'FileQuestion',
  },
  {
    step: '4',
    label: 'Identify Weak Topics',
    description: 'System isolates misconceptions and low-confidence points',
    icon: 'Target',
  },
  {
    step: '5',
    label: 'Recommended Next Step',
    description: 'Targeted drills automatically update your study queue',
    icon: 'ArrowRightCircle',
  },
  {
    step: '6',
    label: 'Track Progress',
    description: 'Verified XP and mastery gains update your profile & path',
    icon: 'TrendingUp',
  },
];
