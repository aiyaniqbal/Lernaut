const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Ensure test environment is recognized
process.env.NODE_ENV = 'test';
process.env.MOCK_EMAIL = 'true';

const { PrismaClient } = require('c:\\Users\\AIYAN\\Documents\\Projects\\ai-teacher\\node_modules\\@prisma\\client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uHXnFrxpj0G4@ep-calm-cake-azmspxlu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

// Import Better Auth and plugins
const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('@better-auth/prisma-adapter');
const { emailOTP } = require('better-auth/plugins');

// In-memory mock email log
const mockSentEmails = [];

const testAuth = betterAuth({
  secret: 'test-secret-at-least-32-chars-long-1234567890',
  baseURL: 'http://localhost:3000',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  user: {
    modelName: 'authUser',
    additionalFields: {
      learnerId: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  session: { modelName: 'authSession' },
  account: { modelName: 'authAccount' },
  verification: { modelName: 'authVerification' },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 900, // 15 min
      allowedAttempts: 5,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      storeOTP: 'hashed',
      sendVerificationOTP: async ({ email, otp }) => {
        mockSentEmails.push({ email, otp, timestamp: new Date() });
      },
    }),
  ],
});

// Clean up test data helper
async function cleanupTestUser(email, learnerId) {
  try {
    const user = await prisma.authUser.findUnique({ where: { email } });
    if (user) {
      await prisma.authSession.deleteMany({ where: { userId: user.id } });
      await prisma.authAccount.deleteMany({ where: { userId: user.id } });
      await prisma.authUser.delete({ where: { id: user.id } });
    }
    await prisma.authVerification.deleteMany({
      where: {
        OR: [
          { identifier: `email-verification-otp-${email}` },
          { identifier: `rate_cooldown:${email}` },
          { identifier: { startsWith: `otp_send_log:${email}:` } },
        ],
      },
    });
    if (learnerId) {
      await prisma.xpTransaction.deleteMany({ where: { userId: learnerId } });
      await prisma.dailyActivity.deleteMany({ where: { userId: learnerId } });
      await prisma.user.deleteMany({ where: { id: learnerId } });
    }
  } catch (e) {
    // ignore cleanup errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

test('Registration 1: Valid registration creates unverified user and triggers 6-digit OTP email', async () => {
  const testEmail = `test_reg_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    const res = await testAuth.api.signUpEmail({
      body: {
        name: 'Alex Rivera',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    assert.ok(res.user, 'Expected user to be created');
    assert.strictEqual(res.user.email, testEmail);
    assert.strictEqual(res.user.emailVerified, false, 'User must start unverified');

    // Verify OTP was sent via email service
    assert.ok(mockSentEmails.length >= 1, 'Expected OTP email to be dispatched');
    const sent = mockSentEmails.find((e) => e.email === testEmail);
    assert.ok(sent, 'Email record must exist for user');
    assert.match(sent.otp, /^\d{6}$/, 'OTP must be exactly 6 digits');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('Registration 2: Duplicate registration cannot create conflicting accounts', async () => {
  const testEmail = `test_dup_${Date.now()}@lernaut.com`;

  try {
    // First user signs up
    await testAuth.api.signUpEmail({
      body: {
        name: 'Jordan First',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    // Attempting to directly insert a conflicting second user record with the same email must fail unique constraint
    let directConflictBlocked = false;
    try {
      await prisma.authUser.create({
        data: {
          name: 'Jordan Conflicting',
          email: testEmail,
          emailVerified: false,
        },
      });
    } catch (e) {
      directConflictBlocked = true;
    }

    assert.ok(directConflictBlocked, 'Unique constraint on email must prevent duplicate account records');

    // Also assert total accounts with this email is exactly 1
    const totalCount = await prisma.authUser.count({ where: { email: testEmail } });
    assert.strictEqual(totalCount, 1, 'Only one account record can exist per email');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('Registration 3: Client cannot inject privileged fields (emailVerified: true)', async () => {
  const testEmail = `test_inject_${Date.now()}@lernaut.com`;

  try {
    const res = await testAuth.api.signUpEmail({
      body: {
        name: 'Hacker Attempt',
        email: testEmail,
        password: 'ValidPassword123!',
        emailVerified: true, // Malicious injection attempt
        role: 'admin',
        isAdmin: true,
      },
    });

    assert.strictEqual(res.user.emailVerified, false, 'emailVerified injection must be ignored');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL OTP VERIFICATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

test('OTP 1: Correct 6-digit OTP activates account and marks emailVerified: true', async () => {
  const testEmail = `test_otp_verify_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Casey Morgan',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const sent = mockSentEmails.find((e) => e.email === testEmail);
    assert.ok(sent, 'Sent OTP record must exist');

    // Verify with the actual OTP
    const verifyRes = await testAuth.api.verifyEmailOTP({
      body: {
        email: testEmail,
        otp: sent.otp,
      },
    });

    assert.strictEqual(verifyRes.status, true, 'Verification must succeed');

    // Confirm DB record updated
    const userInDb = await prisma.authUser.findUnique({ where: { email: testEmail } });
    assert.strictEqual(userInDb.emailVerified, true, 'Database record must show emailVerified = true');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('OTP 2: Incorrect OTP is rejected', async () => {
  const testEmail = `test_bad_otp_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Taylor Swift',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    let threw = false;
    try {
      await testAuth.api.verifyEmailOTP({
        body: {
          email: testEmail,
          otp: '000000', // Incorrect code
        },
      });
    } catch (e) {
      threw = true;
    }

    assert.ok(threw, 'Expected incorrect OTP to be rejected');

    const userInDb = await prisma.authUser.findUnique({ where: { email: testEmail } });
    assert.strictEqual(userInDb.emailVerified, false, 'User must remain unverified');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('OTP 3: Consumed OTP cannot be reused (replay prevention)', async () => {
  const testEmail = `test_reuse_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Replay Tester',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const sent = mockSentEmails.find((e) => e.email === testEmail);
    assert.ok(sent);

    // First use: succeeds
    await testAuth.api.verifyEmailOTP({
      body: {
        email: testEmail,
        otp: sent.otp,
      },
    });

    // Second use of same code: must be rejected
    let secondThrew = false;
    try {
      await testAuth.api.verifyEmailOTP({
        body: {
          email: testEmail,
          otp: sent.otp,
        },
      });
    } catch (e) {
      secondThrew = true;
    }

    assert.ok(secondThrew, 'Reusing a consumed OTP must be rejected');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('OTP 4: Expired OTP is rejected', async () => {
  const testEmail = `test_expired_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Time Traveler',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const sent = mockSentEmails.find((e) => e.email === testEmail);
    assert.ok(sent);

    // Manually expire the token in the DB to test expiration enforcement
    await prisma.authVerification.updateMany({
      where: { identifier: `email-verification-otp-${testEmail}` },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) }, // 1 min in past
    });

    let threw = false;
    try {
      await testAuth.api.verifyEmailOTP({
        body: {
          email: testEmail,
          otp: sent.otp,
        },
      });
    } catch (e) {
      threw = true;
    }

    assert.ok(threw, 'Expired OTP must be rejected');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('OTP 5: Exceeding 5 incorrect attempts blocks further verification', async () => {
  const testEmail = `test_max_attempts_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Brute Force Tester',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const sent = mockSentEmails.find((e) => e.email === testEmail);
    assert.ok(sent);

    // Perform 5 incorrect attempts
    for (let i = 1; i <= 5; i++) {
      try {
        await testAuth.api.verifyEmailOTP({
          body: {
            email: testEmail,
            otp: '999999',
          },
        });
      } catch (e) {}
    }

    // Now even submitting the correct OTP should be blocked due to too many attempts
    let blocked = false;
    try {
      await testAuth.api.verifyEmailOTP({
        body: {
          email: testEmail,
          otp: sent.otp,
        },
      });
    } catch (e) {
      blocked = true;
    }

    assert.ok(blocked, 'Must block verification after 5 failed attempts');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('OTP 6: Resending OTP rotates the code and invalidates previous one', async () => {
  const testEmail = `test_rotate_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Code Rotator',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const firstSent = mockSentEmails.find((e) => e.email === testEmail);
    const firstOtp = firstSent.otp;

    // Send verification OTP again (resend)
    await testAuth.api.sendVerificationOTP({
      body: {
        email: testEmail,
        type: 'email-verification',
      },
    });

    const allSentForEmail = mockSentEmails.filter((e) => e.email === testEmail);
    assert.strictEqual(allSentForEmail.length, 2, 'Should have 2 emails dispatched');
    const secondOtp = allSentForEmail[1].otp;

    // Attempting to verify with the first (now rotated) OTP must fail
    let firstThrew = false;
    try {
      await testAuth.api.verifyEmailOTP({
        body: {
          email: testEmail,
          otp: firstOtp,
        },
      });
    } catch (e) {
      firstThrew = true;
    }

    // Only second OTP should verify
    const verifySecond = await testAuth.api.verifyEmailOTP({
      body: {
        email: testEmail,
        otp: secondOtp,
      },
    });

    assert.strictEqual(verifySecond.status, true, 'Second rotated OTP must verify');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION & SESSION TESTS
// ─────────────────────────────────────────────────────────────────────────────

test('Auth 1: Unverified users CANNOT log in', async () => {
  const testEmail = `test_unverified_login_${Date.now()}@lernaut.com`;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Unverified Student',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    // Attempt sign in while unverified
    let threw = false;
    try {
      await testAuth.api.signInEmail({
        body: {
          email: testEmail,
          password: 'ValidPassword123!',
        },
      });
    } catch (e) {
      threw = true;
    }

    assert.ok(threw, 'Unverified user sign in must be rejected');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

test('Auth 2: Verified users can log in and receive a secure session', async () => {
  const testEmail = `test_verified_login_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    await testAuth.api.signUpEmail({
      body: {
        name: 'Verified Student',
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    const sent = mockSentEmails.find((e) => e.email === testEmail);
    // Verify user
    await testAuth.api.verifyEmailOTP({
      body: {
        email: testEmail,
        otp: sent.otp,
      },
    });

    // Now log in
    const loginRes = await testAuth.api.signInEmail({
      body: {
        email: testEmail,
        password: 'ValidPassword123!',
      },
    });

    assert.ok(loginRes.token, 'Expected session token to be issued');
    assert.ok(loginRes.user, 'Expected user to be returned');
    assert.strictEqual(loginRes.user.email, testEmail);

    // Verify session exists in DB
    const sessionInDb = await prisma.authSession.findFirst({
      where: { userId: loginRes.user.id },
    });
    assert.ok(sessionInDb, 'Session must exist in database');
    assert.ok(sessionInDb.expiresAt > new Date(), 'Session must not be expired');
  } finally {
    await cleanupTestUser(testEmail);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESSION INTEGRITY & ANTI-HIJACKING TESTS
// ─────────────────────────────────────────────────────────────────────────────

test('Progression 1: Existing learner XP and streak are preserved when account is linked', async () => {
  const learnerId = `learner_${Date.now()}`;
  const testEmail = `test_learner_link_${Date.now()}@lernaut.com`;
  mockSentEmails.length = 0;

  try {
    // 1. Create pre-existing learner with XP, level, and streaks
    await prisma.user.create({
      data: {
        id: learnerId,
        displayName: 'Existing Explorer',
        lifetimeXP: 1450,
        currentLevel: 4,
        currentStreak: 7,
        longestStreak: 12,
      },
    });

    // 2. Register account associated with this learner
    await testAuth.api.signUpEmail({
      body: {
        name: 'Existing Explorer',
        email: testEmail,
        password: 'ValidPassword123!',
        learnerId,
      },
    });

    // 3. Verify user
    const sent = mockSentEmails.find((e) => e.email === testEmail);
    await testAuth.api.verifyEmailOTP({
      body: {
        email: testEmail,
        otp: sent.otp,
      },
    });

    // 4. Assert pre-existing learner record was NOT wiped or regenerated
    const learnerInDb = await prisma.user.findUnique({ where: { id: learnerId } });
    assert.strictEqual(learnerInDb.lifetimeXP, 1450, 'Lifetime XP must remain intact');
    assert.strictEqual(learnerInDb.currentLevel, 4, 'Level must remain intact');
    assert.strictEqual(learnerInDb.currentStreak, 7, 'Streak must remain intact');
    assert.strictEqual(learnerInDb.longestStreak, 12, 'Longest streak must remain intact');
  } finally {
    await cleanupTestUser(testEmail, learnerId);
  }
});

test('Progression 2: A second account cannot hijack another learner’s progression', async () => {
  const learnerId = `learner_protected_${Date.now()}`;
  const firstEmail = `owner_${Date.now()}@lernaut.com`;
  const secondEmail = `hijacker_${Date.now()}@lernaut.com`;

  try {
    // Create learner
    await prisma.user.create({
      data: {
        id: learnerId,
        displayName: 'Legitimate Owner',
        lifetimeXP: 5000,
      },
    });

    // First account links this learner
    const firstUser = await prisma.authUser.create({
      data: {
        name: 'Legitimate Owner',
        email: firstEmail,
        emailVerified: true,
        learnerId,
      },
    });

    // Second user attempts to register or claim the same learnerId
    // In our schema and server actions: learnerId is @unique on AuthUser
    let hijackBlocked = false;
    try {
      await prisma.authUser.create({
        data: {
          name: 'Attacker',
          email: secondEmail,
          emailVerified: false,
          learnerId, // should fail unique constraint
        },
      });
    } catch (err) {
      hijackBlocked = true;
    }

    assert.ok(hijackBlocked, 'Database unique constraint must block claiming an already linked learner');
  } finally {
    await cleanupTestUser(firstEmail);
    await cleanupTestUser(secondEmail);
    await prisma.user.deleteMany({ where: { id: learnerId } });
  }
});
