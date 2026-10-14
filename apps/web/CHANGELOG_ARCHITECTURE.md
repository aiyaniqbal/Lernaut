# Lernaut Progression & Active Leaderboard Architecture Documentation

> **Last Updated**: October 14, 2026  
> **Repository**: [aiyaniqbal/Lernaut](https://github.com/aiyaniqbal/Lernaut.git)  
> **Database**: Neon Serverless PostgreSQL (Singapore AWS Region)

---

## 1. Executive Summary

This document details the complete end-to-end architecture and all modifications made to resolve the stagnant XP and leaderboard ranking issue in Lernaut, along with the integration of the retro 8-bit Pac-Man Red Ghost loader component.

Prior to these fixes:
1. **Quizzes** generated and evaluated client-side only stored scores in React state/localStorage and never invoked server actions to award XP.
2. **AI Teacher Lessons** had the final "Lesson Complete" button disabled on the last concept and never wrote completion records or XP to PostgreSQL.
3. **Leaderboard queries** ignored the browser client identity and only aggregated seeded records, causing real users to be omitted.
4. **Idempotency keys** were strictly blocking retakes, meaning repeat practice awarded 0 XP.

---

## 2. Architecture & Data Flow

```
+----------------------------------------------------------------------------------+
|                               Client Browser                                     |
|                                                                                  |
|  [useUserId / getUserIdSync]                                                     |
|       |                                                                          |
|       +--> Generates & stores UUID in localStorage ('lernaut_user_id')           |
|       |                                                                          |
|       +--> AiTeacherWorkspace.tsx                                                |
|       |       - Quick Check Success   ==> awardQuickCheckXP (+10 XP)             |
|       |       - Lesson Complete       ==> completeLesson (+25 XP first, +10 rev) |
|       |                                                                          |
|       +--> QuizWorkspace.tsx                                                     |
|       |       - Test Submission       ==> submitQuiz (5 base XP + up to 15 bonus)|
|       |                                                                          |
|       +--> LeaderboardView.tsx                                                   |
|               - Fetches getWeeklyLeaderboard(currentUserId)                      |
|               - Displays "Your Current Ranking" banner                           |
|               - Highlights user's row with "YOU" badge                           |
|               - Uses PixelGhostLoader (8-bit Pac-Man ghost) for loading state    |
+----------------------------------------------------------------------------------+
                                        |
                             (Server Actions / Prisma)
                                        v
+----------------------------------------------------------------------------------+
|                            Neon PostgreSQL Database                              |
|                                                                                  |
|  - User:            lifetimeXP, currentLevel, currentStreak, displayName        |
|  - Profile:         totalXP, level, streakDays, username                         |
|  - XpTransaction:   Ledger of every XP event (weekly aggregation source)         |
|  - LessonProgress:  Completion status, attempts, bestScore, timestamps          |
|  - DailyActivity:   Daily lesson/quiz counts & qualifying streaks                |
|  - Achievement:     Milestones (10 system achievements seeded)                   |
|  - UserAchievement: Unlocked achievement records                                 |
+----------------------------------------------------------------------------------+
```

---

## 3. Comprehensive File-by-File Changes

### A. Core Progression Server Actions
- **File**: `apps/web/src/app/actions/progression.ts`
  - **`ensureUser(userId, displayName)`**: Upserts both `User` and `Profile` tables so both legacy and modern UI components have matching records without orphaned relation errors.
  - **`awardQuickCheckXP(userId, conceptId, conceptTitle)`**: New server action awarding +10 XP and recording qualifying activity whenever a student answers an interactive Quick Check correctly in the AI Teacher workspace.
  - **`completeLesson(userId, lessonId, lessonTitle)`**: Grants 25 XP for first-time completion and 10 XP for review/reinforcement. Updates `LessonProgress`, records qualifying activity for streak calculation, and evaluates unlockable achievements.
  - **`submitQuiz(userId, quizId, quizTopic, scorePercent)`**: Grants 5 base XP (for first-time attempts and retakes) + performance bonus up to 15 XP based on score. Incorporates unique timestamped idempotency keys so repeated quiz sessions actively award XP.
  - **`getWeeklyLeaderboard(currentUserId?: string)`**:
    - Calculates Monday 00:00 UTC through Sunday 23:59 UTC.
    - Groups and sums `XpTransaction` amounts.
    - Resolves `currentUserId`, guaranteeing the active learner appears in the leaderboard with their exact rank even if they have 0 XP or are climbing up.
    - Merges active users with community leaderboard competitors.
    - Sets `isCurrentUser: true` on the active user's entry.
  - **`getLifetimeLeaderboard(currentUserId?: string)`**:
    - Orders by total `lifetimeXP`.
    - Guarantees active user inclusion and `isCurrentUser` resolution.

### B. Legacy XP & Daily Goals
- **File**: `apps/web/src/app/actions/xp.ts`
  - Updated `getProfile(userId?: string)` to accept an optional `userId` so that single-user and multi-user contexts resolve the active profile correctly instead of always returning the first seeded database row.
  - Fixed strict TypeScript annotations for `completed: string[]` and `logs.map((l: { missionId: string }))`.
- **File**: `apps/web/src/components/dashboard/DailyGoal.tsx`
  - Updated `fetchXp` to pass `getUserIdSync()` to `getProfile(uid)`.
  - Ensures the radial XP gauge accurately reflects the logged-in user's progress toward the next level.

### C. Client Identity Hook
- **File**: `apps/web/src/hooks/useUserId.ts`
  - Updated `getUserIdSync()` to proactively generate and persist a UUID (`crypto.randomUUID()`) in `localStorage` if not already present. This ensures zero null-pointer issues during immediate synchronous component calls before React hooks run.

### D. Quiz Workspace
- **File**: `apps/web/src/components/quiz/QuizWorkspace.tsx`
  - In `handleSubmitTest`, wired `await submitQuiz(userId, newResult.id, newResult.topic, score)`.
  - Automatically awards base XP + performance XP and triggers celebratory confetti when passing (score >= 70%).

### E. AI Teacher Workspace
- **File**: `apps/web/src/components/learn/AiTeacherWorkspace.tsx`
  - In `handleSubmitAnswer`, calls `awardQuickCheckXP(...)` whenever `isCorrect === true`.
  - In `moveToNextConcept`, calls `completeLesson(...)` and fires confetti when the last concept is reached.
  - Removed `disabled` constraint on the final concept button, renaming it to `"🎉 Complete Lesson & Claim XP"`.

### F. Leaderboard UI & Retro 8-bit Pac-Man Loader
- **File**: `apps/web/src/components/leaderboard/LeaderboardView.tsx`
  - Replaced the generic CSS spinner with `<PixelGhostLoader message="Summoning Global Rankings..." />`.
  - Passes `currentUserId` to both `getWeeklyLeaderboard` and `getLifetimeLeaderboard`.
  - Added a prominent **"Your Current Ranking"** banner at the top showing the active user's current rank (`#1`, `#4`, etc.), weekly/lifetime XP, and day streak.
  - Highlights the current user's row in the table with a distinct violet background accent and a bold `YOU` badge.
- **Files**: `apps/web/src/components/common/PixelGhostLoader.tsx` & `PixelGhostLoader.css`
  - Authentic 8-bit Pac-Man Red Ghost loader styled from Uiverse.io by BlackisPlay.
  - Features 14x14 CSS grid layout (`top0`..`top4`, `st0`..`st5`, `an1`..`an18`), bouncing hover animation (`upNDown`), side-to-side pupil movement (`eyesMovement`), tentacles walking flicker (`flicker0`, `flicker1`), and radial shadow pulsing (`shadowMovement`).

### G. Application Root State
- **File**: `apps/web/src/App.tsx`
  - Initialized `useUserId(student.name)` in `MainApp` so browser accounts are registered and synchronized in Neon DB upon landing.

---

## 4. Database Seeding & Schema

- **File**: `apps/web/prisma/seed.js`
- Contains 10 system achievements:
  - `first_steps` (25 XP)
  - `quiz_starter` (50 XP)
  - `perfect_score` (30 XP)
  - `learning_explorer` (50 XP)
  - `on_a_roll` (30 XP)
  - `consistency_champion` (100 XP)
  - `monthly_momentum` (150 XP)
  - `knowledge_seeker` (75 XP)
  - `scholar` (100 XP)
  - `mastery_milestone` (75 XP)
- Community users seeded with active streaks, levels, profiles, and initial weekly XP:
  - Aarav Sharma (`aarav_ai`) — 520 weekly XP / Level 8
  - Zara Chen (`zara_learns`) — 440 weekly XP / Level 7
  - Leo Martinez (`leo_space`) — 375 weekly XP / Level 6
  - Priya Patel (`priya_scholar`) — 310 weekly XP / Level 5
  - Elena Rostova (`elena_r`) — 250 weekly XP / Level 4
  - David Kim (`dkim_learn`) — 190 weekly XP / Level 3

---

## 5. Verification Commands

To verify and maintain this setup in future sessions:

```bash
# 1. Check TypeScript types
cd apps/web
npx tsc --noEmit

# 2. Run database migrations or client generation
npx prisma generate

# 3. Re-seed community leaderboard and achievements (if needed)
node prisma/seed.js

# 4. Run production build
npm run build
```

---

## 6. Commit History for this Feature
- `b1c1100`: Prisma standardization, seed migration, and type problem fixes.
- `00ae7a1`: Live active leaderboard XP/ranking updates and 8-bit Pacman Ghost loader.
- `c35c848`: Strict explicit typing of completed missions in `xp.ts`.
