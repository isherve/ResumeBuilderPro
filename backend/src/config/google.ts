import { env } from '../config/env.js';

export const isGoogleAuthEnabled = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());

export const isDevGoogleAuthEnabled = (): boolean =>
  env.NODE_ENV === 'development' && !isGoogleAuthEnabled();

export const getGoogleCallbackUrl = (): string =>
  env.GOOGLE_CALLBACK_URL || `${env.API_URL}/api/auth/google/callback`;
