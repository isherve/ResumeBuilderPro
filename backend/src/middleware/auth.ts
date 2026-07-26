import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';
import prisma from '../lib/prisma.js';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: JwtPayload & { id: string };
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError(401, 'User not found');
    }

    req.authUser = { ...payload, id: user.id };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      req.authUser = { ...payload, id: payload.userId };
    }
    next();
  } catch {
    next();
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.authUser?.role !== 'ADMIN') {
    next(new AppError(403, 'Admin access required'));
    return;
  }
  next();
};

export const requirePremium = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.authUser) {
      throw new AppError(401, 'Authentication required');
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.authUser.userId,
        status: 'ACTIVE',
        plan: { in: ['PREMIUM', 'ENTERPRISE'] },
      },
    });

    if (!subscription) {
      throw new AppError(403, 'Premium subscription required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const getParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;
