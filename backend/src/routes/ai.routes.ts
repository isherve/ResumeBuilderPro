import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { ATSService } from '../services/ats.service.js';
import { authenticate, getParam } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AIService.generateSummary(req.authUser!.userId, req.body);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/improve-bullet',
  asyncHandler(async (req: Request, res: Response) => {
    const { bullet, jobTitle } = req.body;
    const result = await AIService.improveBullet(req.authUser!.userId, bullet, jobTitle);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/rewrite-bullets',
  asyncHandler(async (req: Request, res: Response) => {
    const { bullets, jobTitle } = req.body;
    const result = await AIService.rewriteBullets(req.authUser!.userId, bullets, jobTitle);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/suggest-skills',
  asyncHandler(async (req: Request, res: Response) => {
    const { jobTitle, existingSkills } = req.body;
    const result = await AIService.suggestSkills(req.authUser!.userId, jobTitle, existingSkills || []);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/cover-letter',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AIService.generateCoverLetter(req.authUser!.userId, req.body);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/grammar',
  asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body;
    const result = await AIService.grammarCorrection(req.authUser!.userId, text);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/review',
  asyncHandler(async (req: Request, res: Response) => {
    const { resumeContent } = req.body;
    const result = await AIService.reviewResume(req.authUser!.userId, resumeContent);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/ats/:resumeId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await ATSService.analyzeResume(req.authUser!.userId, getParam(req.params.resumeId));
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/job-match/:resumeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { jobDescription } = req.body;
    const result = await ATSService.matchJob(req.authUser!.userId, getParam(req.params.resumeId), jobDescription);
    res.json({ success: true, data: result });
  }),
);

export default router;
