import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, getParam } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.authUser!.userId;

    const [
      resumeCount,
      recentResumes,
      downloadedCount,
      recentActivity,
      subscription,
      aiUsageCount,
    ] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { template: { select: { name: true, thumbnail: true } } },
      }),
      prisma.resumeExport.count({
        where: { resume: { userId } },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aIUsage.count({ where: { userId } }),
    ]);

    const avgAtsScore = await prisma.resume.aggregate({
      where: { userId },
      _avg: { atsScore: true, resumeScore: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileCompletion: true, name: true, avatar: true },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalResumes: resumeCount,
          totalDownloads: downloadedCount,
          avgAtsScore: Math.round(avgAtsScore._avg.atsScore || 0),
          avgResumeScore: Math.round(avgAtsScore._avg.resumeScore || 0),
          aiUsageCount,
          profileCompletion: user?.profileCompletion || 0,
          plan: subscription?.plan || 'FREE',
        },
        recentResumes,
        recentActivity,
        user: { name: user?.name, avatar: user?.avatar },
      },
    });
  }),
);

router.get(
  '/notifications',
  asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.authUser!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: notifications });
  }),
);

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.update({
      where: { id: getParam(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true });
  }),
);

export default router;
