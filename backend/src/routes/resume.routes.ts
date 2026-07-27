import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ResumeService } from '../services/resume.service.js';
import { authenticate, getParam } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validator.js';
import {
  extractTextFromFile,
  isSupportedImportFile,
  parseImportedResume,
} from '../services/resumeImport.service.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const resumeImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isSupportedImportFile(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Upload PDF, Word (.doc/.docx), TXT, or JSON.'));
    }
  },
});

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

router.post(
  '/import',
  uploadLimiter,
  resumeImportUpload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const templateId = req.body?.templateId;
    if (!templateId || typeof templateId !== 'string') {
      throw new AppError(400, 'templateId is required');
    }

    const title =
      typeof req.body?.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : `Imported Resume - ${req.file.originalname.replace(/\.[^.]+$/, '')}`;

    const { text, isJson } = await extractTextFromFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    const content = await parseImportedResume(req.authUser!.userId, text, isJson);
    const resume = await ResumeService.create(req.authUser!.userId, {
      title,
      templateId,
      content,
    });

    res.status(201).json({
      success: true,
      data: resume,
      message: 'Resume imported successfully. Please review all fields.',
    });
  }),
);

router.post(
  '/:id/import',
  uploadLimiter,
  resumeImportUpload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const resumeId = getParam(req.params.id);
    await ResumeService.findById(req.authUser!.userId, resumeId);

    const { text, isJson } = await extractTextFromFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    const content = await parseImportedResume(req.authUser!.userId, text, isJson);
    const resume = await ResumeService.update(req.authUser!.userId, resumeId, { content });

    res.json({
      success: true,
      data: resume,
      message: 'Your document was imported into this resume. Review each section before exporting.',
    });
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
