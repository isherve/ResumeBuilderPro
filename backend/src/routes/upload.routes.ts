import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import prisma from '../lib/prisma.js';

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.post(
  '/avatar',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    if (!env.CLOUDINARY_CLOUD_NAME) {
      res.json({
        success: true,
        data: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` },
      });
      return;
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'resume-builder/avatars', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      stream.end(req.file!.buffer);
    });

    await prisma.user.update({
      where: { id: req.authUser!.userId },
      data: { avatar: result.secure_url },
    });

    res.json({ success: true, data: { url: result.secure_url } });
  }),
);

router.post(
  '/resume-photo',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    if (!env.CLOUDINARY_CLOUD_NAME) {
      res.json({
        success: true,
        data: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` },
      });
      return;
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'resume-builder/photos' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      stream.end(req.file!.buffer);
    });

    res.json({ success: true, data: { url: result.secure_url } });
  }),
);

export default router;
