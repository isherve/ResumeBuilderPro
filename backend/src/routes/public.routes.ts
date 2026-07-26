import { Router, Request, Response } from 'express';
import { ResumeService } from '../services/resume.service.js';
import { optionalAuth, getParam } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get(
  '/:token',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const resume = await ResumeService.findByShareToken(getParam(req.params.token));
    res.json({ success: true, data: resume });
  }),
);

export default router;
