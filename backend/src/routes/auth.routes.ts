import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';
import { env } from '../config/env.js';
import { isGoogleAuthEnabled, isDevGoogleAuthEnabled, getGoogleCallbackUrl } from '../config/google.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { buildAuthResponse, findOrCreateGoogleUser, DEV_GOOGLE_PROFILE } from '../services/googleAuth.service.js';
import prisma from '../lib/prisma.js';

const router = Router();

type GoogleUser = { id: string; email: string; role: string };

const configureGoogleStrategy = (): void => {
  if (!isGoogleAuthEnabled()) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: getGoogleCallbackUrl(),
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              done(new AppError(400, 'Google account has no email address'));
              return;
            }

            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  isEmailVerified: true,
                  avatar: profile.photos?.[0]?.value,
                },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  name: profile.displayName || 'User',
                  email,
                  googleId: profile.id,
                  avatar: profile.photos?.[0]?.value,
                  isEmailVerified: true,
                  profileCompletion: 33,
                },
              });

              await prisma.subscription.create({
                data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
              });
            }
          }

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
};

configureGoogleStrategy();

const requireGoogleAuth = (_req: Request, res: Response, next: NextFunction): void => {
  if (!isGoogleAuthEnabled()) {
    res.redirect(`${env.FRONTEND_URL}/login?error=google_not_configured`);
    return;
  }
  next();
};

router.get('/google/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      enabled: isGoogleAuthEnabled(),
      devMode: isDevGoogleAuthEnabled(),
      callbackUrl: getGoogleCallbackUrl(),
    },
  });
});

router.post(
  '/google/dev',
  authLimiter,
  asyncHandler(async (_req: Request, res: Response) => {
    if (!isDevGoogleAuthEnabled()) {
      throw new AppError(403, 'Dev Google sign-in is only available in local development');
    }

    const user = await findOrCreateGoogleUser(DEV_GOOGLE_PROFILE);
    const result = buildAuthResponse(user as typeof user & Record<string, unknown>);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);
    res.status(201).json({ success: true, data: result });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  }),
);

router.post(
  '/verify-email',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/forgot-password',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await AuthService.forgotPassword(email);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/reset-password',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const result = await AuthService.resetPassword(token, password);
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await AuthService.getProfile(req.authUser!.userId);
    res.json({ success: true, data: profile });
  }),
);

router.put(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateProfileSchema.parse(req.body);
    const profile = await AuthService.updateProfile(req.authUser!.userId, data);
    res.json({ success: true, data: profile });
  }),
);

router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const result = await AuthService.changePassword(
      req.authUser!.userId,
      currentPassword,
      newPassword,
    );
    res.json({ success: true, data: result });
  }),
);

router.delete(
  '/account',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.deleteAccount(req.authUser!.userId);
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/google',
  requireGoogleAuth,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get(
  '/google/callback',
  requireGoogleAuth,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google`,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as GoogleUser;
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
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }),
);

export default router;
