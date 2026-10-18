import nodemailer from 'nodemailer';

/**
 * In-memory test inbox for automated testing environments (NODE_ENV === 'test').
 */
export interface SentEmailLog {
  to: string;
  subject: string;
  otp: string;
  timestamp: Date;
}

export const mockSentEmails: SentEmailLog[] = [];

/**
 * Resets the in-memory test inbox (used in unit tests).
 */
export function clearMockSentEmails(): void {
  mockSentEmails.length = 0;
}

/**
 * HTML Escaping helper to prevent any HTML injection in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build the branded Lernaut OTP Verification email template.
 */
export function buildOtpEmailHtml(email: string, otp: string, displayName?: string): string {
  const safeEmail = escapeHtml(email);
  const safeName = displayName ? escapeHtml(displayName) : 'Learner';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Lernaut Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F6FF;
      color: #252046;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background: #FFFFFF;
      border: 2px solid #E4DFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(57, 36, 130, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #7655FF 0%, #6847FF 55%, #5638E8 100%);
      padding: 32px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .tagline {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.9;
      margin-top: 6px;
    }
    .content {
      padding: 36px 32px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 12px;
      color: #252046;
      text-align: center;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #55506E;
      margin: 0 0 24px;
      text-align: center;
    }
    .otp-box {
      background: #F3EFFF;
      border: 2px dashed #6847FF;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #6847FF;
      margin: 0;
      padding-left: 12px;
    }
    .expiry {
      font-size: 13px;
      font-weight: 700;
      color: #77738D;
      margin-top: 10px;
    }
    .warning {
      background: #FFF7EB;
      border-left: 4px solid #FFAA2B;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #8A5B00;
      margin: 24px 0;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #EFEBF8;
      padding: 24px 32px;
      font-size: 12px;
      color: #8B87A0;
      text-align: center;
      line-height: 1.5;
      background: #FAF9FF;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="logo">LERNAUT</h1>
      <p class="tagline">AI-Powered Gamified Learning</p>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email</h2>
      <p class="text">
        Hello <strong>${safeName}</strong>,<br>
        Please use the 6-digit verification code below to activate your Lernaut account for <strong>${safeEmail}</strong>.
      </p>

      <div class="otp-box">
        <div class="otp-code">${escapeHtml(otp)}</div>
        <div class="expiry">Valid for 15 minutes</div>
      </div>

      <div class="warning">
        <strong>Security notice:</strong> Do not share this code with anyone. Lernaut staff will never ask for your verification code.
      </div>

      <p class="text" style="font-size: 13px; color: #77738D; margin-bottom: 0;">
        If you did not request this verification code, you can safely ignore this email. No account will be activated without this verification.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Lernaut. All rights reserved.<br>
      Empowering mastery through gamified artificial intelligence.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Creates the Nodemailer Gmail SMTP transporter.
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
}

/**
 * Sends the 6-digit OTP email to the user.
 *
 * Supports:
 * - Real Gmail SMTP (when GMAIL_USER & GMAIL_APP_PASSWORD are set)
 * - Test mode (NODE_ENV === 'test'): records to mockSentEmails for automated test verification
 * - Development fallback: logs clean OTP notification to stdout
 */
export async function sendVerificationEmail({
  email,
  otp,
  displayName,
}: {
  email: string;
  otp: string;
  displayName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isTest = process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL === 'true';

  // In test mode: record email to test log
  if (isTest) {
    mockSentEmails.push({
      to: email,
      subject: `Your Lernaut Verification Code: ${otp}`,
      otp,
      timestamp: new Date(),
    });
    return { success: true, messageId: `test-${Date.now()}` };
  }

  const transporter = createTransporter();

  // If no SMTP credentials provided in dev: log safe notice to console
  if (!transporter) {
    console.info(`[Lernaut Email Service] GMAIL_USER not configured. Verification OTP for ${email}: ${otp} (valid for 15 min)`);
    return { success: true, messageId: `dev-fallback-${Date.now()}` };
  }

  try {
    const fromAddress = `"Lernaut Learning" <${process.env.GMAIL_USER}>`;
    const subject = `Your Lernaut Verification Code: ${otp}`;
    const html = buildOtpEmailHtml(email, otp, displayName);
    const text = `Your Lernaut verification code is: ${otp}\n\nThis code expires in 15 minutes.\nDo not share this code with anyone.\n\nIf you did not request this, please ignore this email.`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    // Never leak SMTP credentials or raw passwords in logs
    console.error('[Lernaut Email Service] Failed to send email to', email, 'Error:', err?.message || err);
    return {
      success: false,
      error: 'Failed to deliver verification email. Please check your email address and try again.',
    };
  }
}
