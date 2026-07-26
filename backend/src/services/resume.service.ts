import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { createResumeSchema, updateResumeSchema } from '../validators/resume.validator.js';
import type { z } from 'zod';

type CreateResumeInput = z.infer<typeof createResumeSchema>;
type UpdateResumeInput = z.infer<typeof updateResumeSchema>;

const defaultContent = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: { technical: [], soft: [] },
  languages: [],
  projects: [],
  sectionOrder: [
    'personalInfo', 'summary', 'experience', 'education',
    'skills', 'projects', 'certifications', 'languages',
  ],
  hiddenSections: [],
};

export class ResumeService {
  static async create(userId: string, data: CreateResumeInput) {
    const template = await prisma.template.findUnique({ where: { id: data.templateId } });
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    const resume = await prisma.resume.create({
      data: {
        userId,
        title: data.title || 'Untitled Resume',
        templateId: data.templateId,
        content: data.content || defaultContent,
        theme: (data.theme || template.defaultTheme) as object,
        slug: uuidv4().slice(0, 8),
      },
      include: { template: true },
    });

    await prisma.template.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 }, popularity: { increment: 1 } },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: 'RESUME_CREATED',
        metadata: { resumeId: resume.id, title: resume.title },
      },
    });

    return resume;
  }

  static async findAll(userId: string, filters?: {
    search?: string;
    sort?: 'newest' | 'oldest' | 'downloaded' | 'favorites';
    status?: string;
  }) {
    const where: Record<string, unknown> = { userId };

    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.sort === 'favorites') {
      where.isFavorite = true;
    }

    let orderBy: Record<string, string> = { updatedAt: 'desc' };
    if (filters?.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (filters?.sort === 'downloaded') orderBy = { downloadCount: 'desc' };

    return prisma.resume.findMany({
      where,
      orderBy,
      include: { template: { select: { name: true, slug: true, thumbnail: true, category: true } } },
    });
  }

  static async findById(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        template: true,
        versions: { orderBy: { version: 'desc' }, take: 10 },
      },
    });

    if (!resume) {
      throw new AppError(404, 'Resume not found');
    }

    return resume;
  }

  static async findByShareToken(shareToken: string) {
    const resume = await prisma.resume.findFirst({
      where: { shareToken, isPublic: true },
      include: { template: true },
    });

    if (!resume) {
      throw new AppError(404, 'Resume not found or not public');
    }

    await prisma.resume.update({
      where: { id: resume.id },
      data: { viewCount: { increment: 1 } },
    });

    await prisma.resumeAnalytics.create({
      data: { resumeId: resume.id, event: 'view', metadata: {} },
    });

    return resume;
  }

  static async update(userId: string, resumeId: string, data: UpdateResumeInput) {
    const existing = await this.findById(userId, resumeId);

    const resume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...data,
        lastEditedAt: new Date(),
      },
      include: { template: true },
    });

    if (data.content || data.theme) {
      const latestVersion = await prisma.resumeVersion.findFirst({
        where: { resumeId },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;
      await prisma.resumeVersion.create({
        data: {
          resumeId,
          version: nextVersion,
          content: resume.content as object,
          theme: resume.theme as object,
          label: `Version ${nextVersion}`,
        },
      });
    }

    await prisma.activity.create({
      data: {
        userId,
        type: 'RESUME_UPDATED',
        metadata: { resumeId, title: resume.title },
      },
    });

    return resume;
  }

  static async delete(userId: string, resumeId: string) {
    await this.findById(userId, resumeId);
    await prisma.resume.delete({ where: { id: resumeId } });

    await prisma.activity.create({
      data: { userId, type: 'RESUME_DELETED', metadata: { resumeId } },
    });

    return { message: 'Resume deleted successfully' };
  }

  static async duplicate(userId: string, resumeId: string) {
    const original = await this.findById(userId, resumeId);

    const duplicate = await prisma.resume.create({
      data: {
        userId,
        title: `${original.title} (Copy)`,
        templateId: original.templateId,
        content: original.content as object,
        theme: original.theme as object,
        slug: uuidv4().slice(0, 8),
      },
      include: { template: true },
    });

    return duplicate;
  }

  static async toggleFavorite(userId: string, resumeId: string) {
    const resume = await this.findById(userId, resumeId);
    return prisma.resume.update({
      where: { id: resumeId },
      data: { isFavorite: !resume.isFavorite },
    });
  }

  static async generateShareLink(userId: string, resumeId: string) {
    const resume = await this.findById(userId, resumeId);
    const shareToken = resume.shareToken || uuidv4();

    return prisma.resume.update({
      where: { id: resumeId },
      data: { shareToken, isPublic: true },
    });
  }

  static async restoreVersion(userId: string, resumeId: string, versionId: string) {
    await this.findById(userId, resumeId);

    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
    });

    if (!version) {
      throw new AppError(404, 'Version not found');
    }

    return prisma.resume.update({
      where: { id: resumeId },
      data: {
        content: version.content as object,
        theme: version.theme as object,
        lastEditedAt: new Date(),
      },
      include: { template: true },
    });
  }

  static async recordDownload(userId: string, resumeId: string, format: string) {
    await this.findById(userId, resumeId);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { downloadCount: { increment: 1 } },
    });

    await prisma.resumeExport.create({
      data: { resumeId, format: format as 'PDF' | 'DOCX' | 'TXT' | 'JSON' },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: 'RESUME_DOWNLOADED',
        metadata: { resumeId, format },
      },
    });
  }
}
