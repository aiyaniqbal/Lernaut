import { prisma } from '@/lib/prisma';

/**
 * Server-side durable rate limiter using the database (compatible with serverless Neon / Vercel).
 *
 * Rules:
 * - 1 OTP send per email every 60 seconds (cooldown).
 * - Max 3 OTP sends per email in 15 minutes (burst window).
 */

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
}

export async function checkOtpSendRateLimit(email: string): Promise<RateLimitResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();
  const identifierCooldown = `rate_cooldown:${normalizedEmail}`;
  const identifierWindow = `rate_window:${normalizedEmail}`;

  try {
    // 1. Check 60-second cooldown
    const cooldownRecord = await prisma.authVerification.findFirst({
      where: {
        identifier: identifierCooldown,
        expiresAt: { gt: now },
      },
    });

    if (cooldownRecord) {
      const remainingSeconds = Math.max(
        1,
        Math.ceil((cooldownRecord.expiresAt.getTime() - now.getTime()) / 1000)
      );
      return {
        allowed: false,
        retryAfterSeconds: remainingSeconds,
        reason: `Please wait ${remainingSeconds} seconds before requesting another code.`,
      };
    }

    // 2. Check 15-minute window count (maximum 3 sends per 15 minutes)
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const recentSends = await prisma.authVerification.count({
      where: {
        identifier: { startsWith: `otp_send_log:${normalizedEmail}:` },
        createdAt: { gte: windowStart },
      },
    });

    if (recentSends >= 3) {
      return {
        allowed: false,
        retryAfterSeconds: 900,
        reason: 'Too many verification code requests. Please wait 15 minutes before trying again.',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.warn('[RateLimiter] Database rate limit check warning:', err);
    // Fail-open for transient DB hiccups to not block legitimate students
    return { allowed: true };
  }
}

/**
 * Records an OTP send event to enforce the 60s cooldown and 15m window.
 */
export async function recordOtpSend(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();
  const cooldownExpires = new Date(now.getTime() + 60 * 1000); // 60s cooldown
  const windowExpires = new Date(now.getTime() + 15 * 60 * 1000); // 15m retention

  try {
    // Upsert cooldown record
    const identifierCooldown = `rate_cooldown:${normalizedEmail}`;
    await prisma.authVerification.upsert({
      where: { id: `cd_${Buffer.from(identifierCooldown).toString('hex').slice(0, 32)}` },
      update: {
        identifier: identifierCooldown,
        value: now.toISOString(),
        expiresAt: cooldownExpires,
        updatedAt: now,
      },
      create: {
        id: `cd_${Buffer.from(identifierCooldown).toString('hex').slice(0, 32)}`,
        identifier: identifierCooldown,
        value: now.toISOString(),
        expiresAt: cooldownExpires,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Record window audit entry
    await prisma.authVerification.create({
      data: {
        identifier: `otp_send_log:${normalizedEmail}:${now.getTime()}`,
        value: 'sent',
        expiresAt: windowExpires,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Clean up stale rate limit records older than 1 hour asynchronously
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    prisma.authVerification
      .deleteMany({
        where: {
          expiresAt: { lt: oneHourAgo },
          identifier: {
            in: [
              identifierCooldown,
              `otp_send_log:${normalizedEmail}:${now.getTime()}`,
            ],
          },
        },
      })
      .catch(() => {});
  } catch (err) {
    console.warn('[RateLimiter] Failed to record rate limit event:', err);
  }
}
