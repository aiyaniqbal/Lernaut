'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkOtpSendRateLimit, recordOtpSend } from '@/lib/rateLimit';

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  needsVerification?: boolean;
  email?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    learnerId: string | null;
  };
}

/**
 * Normalizes email: trim and lowercase without removing dots or plus tags.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates password complexity: minimum 8 characters, maximum 128 characters.
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters.' };
  }
  return { valid: true };
}

/**
 * Register a new user with Email and Password.
 *
 * Enforces:
 * - Server-side validation
 * - Anti-enumeration: consistent response wording
 * - Rate limiting on OTP generation
 * - Secure account-to-learner association
 */
export async function registerWithEmail({
  name,
  email,
  password,
  learnerId,
}: {
  name: string;
  email: string;
  password: string;
  learnerId?: string;
}): Promise<AuthActionResult> {
  const cleanName = (name || '').trim();
  const cleanEmail = normalizeEmail(email || '');

  // 1. Validation
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter a valid name (at least 2 characters).' };
  }
  if (cleanName.length > 60) {
    return { success: false, error: 'Name cannot exceed 60 characters.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // 2. Check existing user
  const existingUser = await prisma.authUser.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    // If the account is already verified, do NOT disclose existence or send duplicate codes
    if (existingUser.emailVerified) {
      return {
        success: true,
        message: 'If this email can be registered, a verification code has been sent.',
        needsVerification: false,
      };
    }

    // If the account exists but is unverified, check rate limit and re-send OTP
    const rateCheck = await checkOtpSendRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: rateCheck.reason,
        code: 'RATE_LIMITED',
        needsVerification: true,
        email: cleanEmail,
      };
    }

    try {
      await auth.api.sendVerificationOTP({
        body: {
          email: cleanEmail,
          type: 'email-verification',
        },
      });
      await recordOtpSend(cleanEmail);

      return {
        success: true,
        message: 'A 6-digit verification code has been sent to your email.',
        needsVerification: true,
        email: cleanEmail,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to send verification code. Please try again.',
      };
    }
  }

  // 3. Rate limit check for new registration OTP
  const rateCheck = await checkOtpSendRateLimit(cleanEmail);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.reason, code: 'RATE_LIMITED' };
  }

  // 4. Validate learnerId association (prevent account hijacking)
  let validatedLearnerId: string | undefined = undefined;
  if (learnerId && typeof learnerId === 'string' && learnerId.trim().length > 0) {
    const trimmedLearnerId = learnerId.trim();
    // Check if another account already owns this learner ID
    const existingClaim = await prisma.authUser.findFirst({
      where: { learnerId: trimmedLearnerId },
    });

    if (!existingClaim) {
      validatedLearnerId = trimmedLearnerId;
    }
  }

  // 5. Create user in Better Auth
  try {
    const reqHeaders = await headers();
    await auth.api.signUpEmail({
      body: {
        name: cleanName,
        email: cleanEmail,
        password,
        learnerId: validatedLearnerId,
      },
      headers: reqHeaders,
    });

    await recordOtpSend(cleanEmail);

    return {
      success: true,
      message: 'Registration started! A 6-digit verification code has been sent to your email.',
      needsVerification: true,
      email: cleanEmail,
    };
  } catch (err: any) {
    console.error('[Auth Action] Registration failed:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Registration failed. Please check your details and try again.',
    };
  }
}

/**
 * Verify Email with 6-Digit OTP.
 *
 * Enforces:
 * - 6-digit format check
 * - Max 5 attempts
 * - Expiration validation (15 minutes)
 * - Atomic code consumption (cannot be reused)
 * - Auto-issuance of session upon verification
 * - Learner profile link guarantee
 */
export async function verifyEmailOtp({
  email,
  otp,
  learnerId,
}: {
  email: string;
  otp: string;
  learnerId?: string;
}): Promise<AuthActionResult> {
  const cleanEmail = normalizeEmail(email || '');
  const cleanOtp = (otp || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Email is required.' };
  }

  if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  try {
    const reqHeaders = await headers();

    // Call Better Auth verifyEmailOTP endpoint
    await auth.api.verifyEmailOTP({
      body: {
        email: cleanEmail,
        otp: cleanOtp,
      },
      headers: reqHeaders,
    });

    // Verification succeeded: find user and ensure learner association
    const authUser = await prisma.authUser.findUnique({
      where: { email: cleanEmail },
      include: { learner: true },
    });

    if (!authUser) {
      return { success: false, error: 'User account not found.' };
    }

    let activeLearnerId = authUser.learnerId;

    if (!activeLearnerId) {
      // Determine if a client-submitted learnerId can be safely claimed
      if (learnerId) {
        const existingClaim = await prisma.authUser.findFirst({
          where: { learnerId, id: { not: authUser.id } },
        });

        if (!existingClaim) {
          const learnerRecord = await prisma.user.findUnique({ where: { id: learnerId } });
          if (!learnerRecord) {
            await prisma.user.create({
              data: { id: learnerId, displayName: authUser.name },
            });
          }
          activeLearnerId = learnerId;
        }
      }

      // If still no learner record, create a new one
      if (!activeLearnerId) {
        const newLearner = await prisma.user.create({
          data: { displayName: authUser.name },
        });
        activeLearnerId = newLearner.id;
      }

      await prisma.authUser.update({
        where: { id: authUser.id },
        data: { learnerId: activeLearnerId },
      });
    }

    return {
      success: true,
      message: 'Account verified successfully!',
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        learnerId: activeLearnerId,
      },
    };
  } catch (err: any) {
    const msg = err?.message || '';

    if (msg.includes('EXPIRED') || msg.toLowerCase().includes('expired')) {
      return {
        success: false,
        error: 'This verification code has expired. Please request a new one.',
        code: 'OTP_EXPIRED',
      };
    }

    if (msg.includes('TOO_MANY_ATTEMPTS') || msg.toLowerCase().includes('too many attempts')) {
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
        code: 'TOO_MANY_ATTEMPTS',
      };
    }

    if (msg.includes('INVALID_OTP') || msg.toLowerCase().includes('invalid')) {
      return {
        success: false,
        error: 'Invalid verification code. Please check your email and try again.',
        code: 'INVALID_OTP',
      };
    }

    return {
      success: false,
      error: msg || 'Verification failed. Please try again.',
    };
  }
}

/**
 * Resend Email Verification OTP.
 *
 * Enforces:
 * - 60s cooldown and 15m window rate limit
 * - No email spamming for already verified accounts
 * - Invalidates / rotates previous code
 */
export async function resendEmailOtp({
  email,
}: {
  email: string;
}): Promise<AuthActionResult> {
  const cleanEmail = normalizeEmail(email || '');
  if (!cleanEmail) {
    return { success: false, error: 'Email is required.' };
  }

  // Check rate limits
  const rateCheck = await checkOtpSendRateLimit(cleanEmail);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.reason, code: 'RATE_LIMITED' };
  }

  // Check if account is already verified
  const user = await prisma.authUser.findUnique({
    where: { email: cleanEmail },
  });

  if (user && user.emailVerified) {
    return {
      success: true,
      message: 'If this email requires verification, a code has been sent.',
    };
  }

  try {
    await auth.api.sendVerificationOTP({
      body: {
        email: cleanEmail,
        type: 'email-verification',
      },
    });

    await recordOtpSend(cleanEmail);

    return {
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to resend verification code. Please try again.',
    };
  }
}

/**
 * Sign In with Email & Password.
 *
 * Enforces:
 * - Mandatory email verification check (unverified accounts cannot log in)
 * - Returns needsVerification: true if unverified
 * - Issues secure session cookie on success
 */
export async function loginWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const cleanEmail = normalizeEmail(email || '');

  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // Check verification state before sign in
  const user = await prisma.authUser.findUnique({
    where: { email: cleanEmail },
  });

  if (user && !user.emailVerified) {
    return {
      success: false,
      error: 'Please verify your email address before logging in.',
      needsVerification: true,
      email: cleanEmail,
    };
  }

  try {
    const reqHeaders = await headers();
    const result = await auth.api.signInEmail({
      body: {
        email: cleanEmail,
        password,
      },
      headers: reqHeaders,
    });

    if (!result || !result.user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const authUser = await prisma.authUser.findUnique({
      where: { id: result.user.id },
    });

    return {
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        learnerId: authUser?.learnerId || null,
      },
    };
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('email_not_verified') || msg.includes('not verified')) {
      return {
        success: false,
        error: 'Please verify your email address before logging in.',
        needsVerification: true,
        email: cleanEmail,
      };
    }

    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }
}

/**
 * Sign Out from the current session.
 * Invalidates the session in the database and clears cookies.
 */
export async function logoutSession(): Promise<{ success: boolean }> {
  try {
    const reqHeaders = await headers();
    await auth.api.signOut({
      headers: reqHeaders,
    });
    return { success: true };
  } catch (e) {
    console.warn('[Auth Action] Error during sign out:', e);
    return { success: true };
  }
}

/**
 * Get current authenticated session user and linked learner ID.
 */
export async function getCurrentUserSession(): Promise<{
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    learnerId: string | null;
  } | null;
}> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user) {
      return { isAuthenticated: false, user: null };
    }

    const authUser = await prisma.authUser.findUnique({
      where: { id: session.user.id },
    });

    return {
      isAuthenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        learnerId: authUser?.learnerId || null,
      },
    };
  } catch (e) {
    return { isAuthenticated: false, user: null };
  }
}
