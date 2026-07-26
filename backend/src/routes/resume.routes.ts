import { Router, Request, Response } from 'express';
import { ResumeService } from '../services/resume.service.js';
import { authenticate, getParam } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, sort, status } = req.query;
    const resumes = await ResumeService.findAll(req.authUser!.userId, {
      search: search as string,
      sort: sort as 'newest' | 'oldest' | 'downloaded' | 'favorites',
      status: status as string,
    });
    res.json({ success: true, data: resumes });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createResumeSchema.parse(req.body);
    const resume = await ResumeService.create(req.authUser!.userId, data);
    res.status(201).json({ success: true, data: resume });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.findById(req.authUser!.userId, getParam(req.params.id));
    res.json({ success: true, data: resume });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateResumeSchema.parse(req.body);
    const resume = await ResumeService.update(req.authUser!.userId, getParam(req.params.id), data);
    res.json({ success: true, data: resume });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await ResumeService.delete(req.authUser!.userId, getParam(req.params.id));
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/:id/duplicate',
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.duplicate(req.authUser!.userId, getParam(req.params.id));
    res.status(201).json({ success: true, data: resume });
  }),
);

router.post(
  '/:id/favorite',
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.toggleFavorite(req.authUser!.userId, getParam(req.params.id));
    res.json({ success: true, data: resume });
  }),
);

router.post(
  '/:id/share',
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.generateShareLink(req.authUser!.userId, getParam(req.params.id));
    res.json({ success: true, data: resume });
  }),
);

router.post(
  '/:id/versions/:versionId/restore',
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.restoreVersion(
      req.authUser!.userId,
      getParam(req.params.id),
      getParam(req.params.versionId),
    );
    res.json({ success: true, data: resume });
  }),
);

router.post(
  '/:id/download',
  asyncHandler(async (req: Request, res: Response) => {
    const { format } = req.body;
    await ResumeService.recordDownload(req.authUser!.userId, getParam(req.params.id), format || 'PDF');
    res.json({ success: true, message: 'Download recorded' });
  }),
);

export default router;
