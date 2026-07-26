import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
};

export const generateEmailToken = (): string => {
  return jwt.sign({ type: 'email_verify' }, env.JWT_SECRET, { expiresIn: '24h' });
};

export const generateResetToken = (): string => {
  return jwt.sign({ type: 'password_reset' }, env.JWT_SECRET, { expiresIn: '1h' });
};
