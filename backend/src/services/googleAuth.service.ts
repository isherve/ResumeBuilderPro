import prisma from '../lib/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

const sanitizeUser = (user: Record<string, unknown>) => {
  const { password, emailVerifyToken, resetPasswordToken, resetPasswordExpires, ...safe } = user;
  return safe;
};

export async function findOrCreateGoogleUser(profile: GoogleProfileInput) {
  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          isEmailVerified: true,
          avatar: profile.avatar ?? user.avatar,
          name: user.name || profile.name,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          avatar: profile.avatar,
          isEmailVerified: true,
          profileCompletion: 33,
        },
      });

      await prisma.subscription.create({
        data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
      });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      name: profile.name,
      avatar: profile.avatar ?? user.avatar,
    },
  });

  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

export function buildAuthResponse(user: { id: string; email: string; role: string } & Record<string, unknown>) {
  const tokens = {
    accessToken: generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
    refreshToken: generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
  };

  return { user: sanitizeUser(user), ...tokens };
}

export const DEV_GOOGLE_PROFILE: GoogleProfileInput = {
  googleId: 'dev-google-ishimwehervin10',
  email: 'ishimwehervin10@gmail.com',
  name: 'ISHIMWE Hervin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ishimwehervin10',
};
