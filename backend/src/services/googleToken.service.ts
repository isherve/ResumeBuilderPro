import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { GoogleProfileInput } from './googleAuth.service.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfileInput> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new AppError(401, 'Invalid Google token');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0] || 'User',
      avatar: payload.picture,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Google sign-in verification failed');
  }
}
