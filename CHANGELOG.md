# Changelog

All notable changes to the **Lernaut** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-18

### 🚨 Critical Security Fixes
- **Fail-Closed Application Route Guarding**:
  - Implemented `<ProtectedRoute>` wrapping `<MainApp />` in `App.tsx`.
  - All interactive application routes (`/#/dashboard`, `/#/learn`, `/#/quiz`, `/#/materials`, `/#/notes`, `/#/profile`, etc.) now strictly require an authenticated, email-verified server session.
  - Unauthenticated access attempts are immediately rejected and redirected to `/login`.
  - Implemented `<PublicOnlyRoute>` for `/login` and `/signup` to redirect authenticated users to `/dashboard`.
  - Updated landing page "Launch App" trigger to verify session before navigating.

- **Elimination of Client-Side Authentication Bypass**:
  - Removed insecure client-side `login()` mock implementation from `useAuth.tsx` that previously forged state in `localStorage` without server validation.
  - Removed client-side mock credentials from `LoginPage.tsx` that previously impersonated `aiyaniqbal77@gmail.com`.
  - Replaced mock demo buttons with a secure server-backed `loginDemoGuest()` flow.

- **Isolated & Restricted Demo Guest Mode**:
  - Implemented `loginAsDemoGuest()` Server Action in `apps/web/src/app/actions/auth.ts`.
  - Operates on an isolated guest account (`guest-demo@lernaut.com`) bound strictly to a dedicated learner record (`demo-guest-learner`).
  - Issues legitimate HTTP-only session cookies via Better Auth without compromising or accessing any real user records or data.

- **Backend Server Action & API Ownership Protection**:
  - Created `getAuthenticatedLearner()` helper to validate active sessions and enforce `emailVerified === true` across all mutations.
  - Enforced ownership verification across all progression mutations: `completeMission`, `completeLesson`, `awardQuickCheckXP`, `submitQuiz`, and `addXp`. Submissions for other user IDs are rejected with 403 Forbidden.
  - Protected read operations (`getProgressSnapshot`, `getFullProgress`, `getCompletedMissionsToday`, and `getProfile`) to strictly return data for the authenticated learner.
  - Secured `GET /api/activity-week` route handler with session authentication (401 on unauthenticated, 403 on mismatched user ID).
  - Protected `ensureUser()` from arbitrary unauthenticated database upserts.
  - Secured weekly and lifetime leaderboards by deriving `isCurrentUser` from the authoritative session rather than client parameters.

- **Session Cookie Propagation Bridge**:
  - Registered `nextCookies()` plugin from `better-auth/next-js` in `apps/web/src/lib/auth.ts` to bridge Better Auth Server Actions (`verifyEmailOtp`, `loginWithEmail`) with Next.js HTTP response cookies.

- **Abuse Prevention & Email OTP Hardening**:
  - Enforced cryptographically secure 6-digit OTP generation and SHA-256 digest hashing (`storeOTP: 'hashed'`).
  - Enforced 15-minute expiration policy and atomic code consumption (replay protection).
  - Enforced 5-attempt brute-force lockout and code rotation on resend requests.
  - Integrated 60-second cooldown and 15-minute window rate limiting.

### 🧪 Automated Testing
- Added comprehensive security test suite in `apps/web/test/auth.test.js`:
  - 21 automated security tests passing with 0 failures.
  - Covers unverified account rejection, credential checks, OTP replay prevention, expired token handling, attempt limits, session invalidation on logout, demo isolation, and learner progression anti-hijacking.

### 📧 Email OTP Delivery Fixes
- **Gmail SMTP Configuration & Resiliency**:
  - Configured Nodemailer with official `service: 'gmail'` transport and explicit timeouts (`connectionTimeout: 10000`, `socketTimeout: 15000`).
  - Sanitized environment variables by stripping surrounding quotes and whitespace from `GMAIL_USER` and `GMAIL_APP_PASSWORD` to ensure clean RFC 5322 header generation.
  - Synchronized Gmail SMTP environment variables between root `.env` and `apps/web/.env`.
  - Removed silent dev fallback in `email.ts` that previously masked delivery failures.
  - Forwarded Next.js request headers to `auth.api.sendVerificationOTP` in `registerWithEmail` and `resendEmailOtp` Server Actions.
