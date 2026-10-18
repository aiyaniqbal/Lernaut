import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { emailOTP } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  'lernaut-secret-dev-environment-key-must-be-at-least-32-chars-long';

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

export const auth = betterAuth({
  secret: authSecret,
  baseURL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Map Better Auth identity tables away from existing User learner progression model
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
  session: {
    modelName: 'authSession',
    expiresIn: 60 * 60 * 24 * 7, // 7 days bounded session
    updateAge: 60 * 60 * 24, // Update session once per day
  },
  account: {
    modelName: 'authAccount',
  },
  verification: {
    modelName: 'authVerification',
  },

  // Enforce server-side email verification before allowing login or issuing session
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  emailVerification: {
    autoSignInAfterVerification: true,
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 15,
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 900, // 15 minutes (900s)
      allowedAttempts: 5, // Maximum 5 attempts per code
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      storeOTP: 'hashed', // Secure hashed OTP persistence
      sendVerificationOTP: async ({ email, otp, type }, ctx) => {
        // Send branded Lernaut verification email
        const res = await sendVerificationEmail({
          email,
          otp,
        });

        if (!res.success && res.error) {
          throw new Error(res.error);
        }
      },
    }),
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Ensure learner record is associated with the authenticated account
            let targetLearnerId = (user as any).learnerId;

            if (targetLearnerId) {
              // Ensure no other account already claimed this learner
              const existingClaim = await prisma.authUser.findFirst({
                where: {
                  learnerId: targetLearnerId,
                  id: { not: user.id },
                },
              });

              if (existingClaim) {
                targetLearnerId = null; // Prevent account hijacking
              }
            }

            if (targetLearnerId) {
              // Check if learner exists in User table, create if missing
              const existingLearner = await prisma.user.findUnique({
                where: { id: targetLearnerId },
              });

              if (!existingLearner) {
                await prisma.user.create({
                  data: {
                    id: targetLearnerId,
                    displayName: user.name || 'Learner',
                  },
                });
              } else if (user.name && existingLearner.displayName === 'Learner') {
                await prisma.user.update({
                  where: { id: targetLearnerId },
                  data: { displayName: user.name },
                });
              }

              // Update authUser to link learner
              await prisma.authUser.update({
                where: { id: user.id },
                data: { learnerId: targetLearnerId },
              });
            } else {
              // Create brand new learner record for this user
              const newLearner = await prisma.user.create({
                data: {
                  displayName: user.name || 'Learner',
                },
              });

              await prisma.authUser.update({
                where: { id: user.id },
                data: { learnerId: newLearner.id },
              });
            }
          } catch (e) {
            console.warn('[Better Auth Hook] Failed to link learner on user create:', e);
          }
        },
      },
    },
  },
});
