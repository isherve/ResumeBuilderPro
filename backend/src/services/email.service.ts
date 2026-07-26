import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: env.SMTP_USER && env.SMTP_PASS ? {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  } : undefined,
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (!env.SMTP_HOST) {
    console.log(`[Email Mock] To: ${options.to}, Subject: ${options.subject}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM || 'ResumeBuilder Pro <noreply@resumebuilderpro.com>',
    ...options,
  });
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email - ResumeBuilder Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to ResumeBuilder Pro!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy this link: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your password - ResumeBuilder Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Password Reset</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });
};
