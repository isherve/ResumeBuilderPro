import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { optionalAuth, authenticate, getParam } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { category, search, premium, sort } = req.query;

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (premium === 'true') where.isPremium = true;
    if (premium === 'false') where.isPremium = false;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
      ];
    }

    let orderBy: Record<string, string> = { popularity: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };

    const templates = await prisma.template.findMany({ where, orderBy });
    res.json({ success: true, data: templates });
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({
      success: true,
      data: categories.map((c) => ({ name: c.category, count: c._count.id })),
    });
  }),
);

router.get(
  '/:slug',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const template = await prisma.template.findUnique({ where: { slug: getParam(req.params.slug) } });
    if (!template) throw new AppError(404, 'Template not found');
    res.json({ success: true, data: template });
  }),
);

router.post(
  '/:id/favorite',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.favoriteTemplate.findUnique({
      where: {
        userId_templateId: {
          userId: req.authUser!.userId,
          templateId: getParam(req.params.id),
        },
      },
    });

    if (existing) {
      await prisma.favoriteTemplate.delete({ where: { id: existing.id } });
      res.json({ success: true, data: { favorited: false } });
    } else {
      await prisma.favoriteTemplate.create({
        data: { userId: req.authUser!.userId, templateId: getParam(req.params.id) },
      });
      res.json({ success: true, data: { favorited: true } });
    }
  }),
);

export default router;
