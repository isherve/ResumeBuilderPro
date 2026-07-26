import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get(
  '/dashboard',
  asyncHandler(async (_req: Request, res: Response) => {
    const [userCount, resumeCount, templateCount, aiUsage, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.template.count(),
      prisma.aIUsage.aggregate({ _sum: { tokens: true }, _count: true }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, createdAt: true, role: true },
      }),
    ]);

    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: userCount,
          totalResumes: resumeCount,
          totalTemplates: templateCount,
          totalAITokens: aiUsage._sum.tokens || 0,
          totalAIRequests: aiUsage._count,
        },
        subscriptions,
        recentUsers,
      },
    });
  }),
);

router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        isEmailVerified: true, createdAt: true, lastLoginAt: true,
        _count: { select: { resumes: true } },
      },
    });
    const total = await prisma.user.count();
    res.json({ success: true, data: { users, total, page, totalPages: Math.ceil(total / limit) } });
  }),
);

router.get(
  '/feedback',
  asyncHandler(async (_req: Request, res: Response) => {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ success: true, data: feedback });
  }),
);

export default router;
