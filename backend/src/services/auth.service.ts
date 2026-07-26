import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailToken,
  generateResetToken,
  verifyAccessToken,
} from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { AppError } from '../middleware/errorHandler.js';
import type { RegisterInput, LoginInput, UpdateProfileInput } from '../validators/auth.validator.js';

const calculateProfileCompletion = (user: Record<string, unknown>): number => {
  const fields = ['name', 'email', 'avatar', 'phone', 'address', 'website', 'linkedin', 'github', 'portfolio'];
  const filled = fields.filter((f) => user[f] && String(user[f]).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
};

const sanitizeUser = (user: Record<string, unknown>) => {
  const { password, emailVerifyToken, resetPasswordToken, resetPasswordExpires, ...safe } = user;
  return safe;
};

export class AuthService {
  static async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    const emailToken = generateEmailToken();

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        emailVerifyToken: emailToken,
        profileCompletion: 22,
      },
    });

    await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    await sendVerificationEmail(user.email, emailToken);

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return { user: sanitizeUser(user as Record<string, unknown>), ...tokens };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.password) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return { user: sanitizeUser(user as Record<string, unknown>), ...tokens };
  }

  static async verifyEmail(token: string) {
    verifyAccessToken(token);
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) {
      throw new AppError(400, 'Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      },
    });

    await sendPasswordResetEmail(email, token);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  static async resetPassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) {
      throw new AppError(400, 'Cannot change password for OAuth accounts');
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const completion = calculateProfileCompletion(user as Record<string, unknown>);
    if (completion !== user.profileCompletion) {
      await prisma.user.update({
        where: { id: userId },
        data: { profileCompletion: completion },
      });
    }

    return sanitizeUser({ ...user, profileCompletion: completion } as Record<string, unknown>);
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const completion = calculateProfileCompletion(user as Record<string, unknown>);
    await prisma.user.update({
      where: { id: userId },
      data: { profileCompletion: completion },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: 'PROFILE_UPDATED',
        metadata: { fields: Object.keys(data) },
      },
    });

    return sanitizeUser({ ...user, profileCompletion: completion } as Record<string, unknown>);
  }

  static async deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }

  static async refreshToken(refreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError(401, 'User not found');
    }
    return this.generateTokens(user.id, user.email, user.role);
  }

  private static generateTokens(userId: string, email: string, role: string) {
    const payload = { userId, email, role };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
