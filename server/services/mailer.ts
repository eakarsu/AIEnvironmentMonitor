/**
 * Mailer service - wraps email sending with graceful fallback.
 * If SMTP_HOST is not configured, logs to console instead of sending.
 * Install nodemailer + @types/nodemailer to enable real email delivery.
 */

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Attempt to load nodemailer dynamically so the app runs even if not installed
let nodemailer: any = null;
try {
  nodemailer = require('nodemailer');
} catch {
  // nodemailer not installed - will use console fallback
}

function createTransporter() {
  if (!nodemailer) return null;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransporter({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });
}

export async function sendMail(options: MailOptions): Promise<void> {
  const smtpConfigured = !!process.env.SMTP_HOST && !!nodemailer;

  if (!smtpConfigured) {
    console.log('[Mailer] SMTP not configured - email would have been sent:');
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body (HTML):\n${options.html}`);
    return;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('[Mailer] Failed to create transporter - check SMTP config');
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log(`[Mailer] Email sent to ${options.to}: ${options.subject}`);
  } catch (error: any) {
    console.error('[Mailer] Failed to send email:', error.message);
    console.log('[Mailer] Email that failed:');
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
  }
}

export function buildPasswordResetEmail(resetToken: string, email: string): MailOptions {
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  return {
    to: email,
    subject: 'Password Reset Request - AI Environment Monitor',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your AI Environment Monitor account.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color:#666;font-size:12px;">Or copy this URL: ${resetUrl}</p>
        <p style="color:#666;font-size:12px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `
  };
}

export function buildVerificationEmail(verificationToken: string, email: string): MailOptions {
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  return {
    to: email,
    subject: 'Verify Your Email - AI Environment Monitor',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Welcome to AI Environment Monitor! Please verify your email address to complete registration.</p>
        <p>
          <a href="${verifyUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color:#666;font-size:12px;">Or copy this URL: ${verifyUrl}</p>
      </div>
    `
  };
}
