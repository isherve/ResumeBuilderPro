import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import PDFParser from 'pdf2json';
import { v4 as uuidv4 } from 'uuid';
import { resumeContentSchema, type ResumeContent } from '../validators/resume.validator.js';
import { AIService } from './ai.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import {
  basicParseResumeText,
  enrichImportedContent,
  finalizeProfessionalImport,
  isBadParsedName,
} from './resumeImport.parser.js';
import {
  extractTextFromImageWithOcr,
  extractTextFromPdfWithOcr,
} from './pdfOcr.service.js';
import { IMPORT_FORMATS_SHORT } from '../constants/importFormats.js';

export { isSupportedImportFile } from '../constants/importFormats.js';

async function extractPdfWithPdfParse(buffer: Buffer): Promise<string> {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pdfParse = require('pdf-parse') as (data: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text?.trim() ?? '';
}

function extractPdfWithPdf2json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true);
    parser.on('pdfParser_dataError', (err: Error | { parserError: Error }) => {
      reject(err instanceof Error ? err : err.parserError);
    });
    parser.on('pdfParser_dataReady', () => {
      resolve(parser.getRawTextContent()?.trim() ?? '');
    });
    parser.parseBuffer(buffer);
  });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const methods = [extractPdfWithPdfParse, extractPdfWithPdf2json];

  for (const method of methods) {
    try {
      const text = await method(buffer);
      if (text.length > 20) return text;
    } catch (error) {
      console.error('PDF extraction attempt failed:', error);
    }
  }

  try {
    const ocrText = await extractTextFromPdfWithOcr(buffer);
    if (ocrText.length > 20) return ocrText;
  } catch (error) {
    console.error('PDF OCR extraction failed:', error);
  }

  return '';
}

async function extractDocText(buffer: Buffer): Promise<string> {
  const tmpPath = join(tmpdir(), `cv-import-${uuidv4()}.doc`);
  await writeFile(tmpPath, buffer);
  try {
    const extractor = new WordExtractor();
    const document = await extractor.extract(tmpPath);
    return document.getBody()?.trim() ?? '';
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<{ text: string; isJson: boolean }> {
  const ext = filename.toLowerCase();

  if (mimetype === 'application/json' || ext.endsWith('.json')) {
    return { text: buffer.toString('utf-8'), isJson: true };
  }

  if (mimetype === 'text/plain' || ext.endsWith('.txt')) {
    return { text: buffer.toString('utf-8'), isJson: false };
  }

  if (mimetype === 'application/pdf' || ext.endsWith('.pdf')) {
    const text = await extractPdfText(buffer);
    if (!text) {
      throw new AppError(
        400,
        `Could not read this PDF. Supported formats: ${IMPORT_FORMATS_SHORT}. For scans, OCR runs automatically — try a clearer file or another format.`,
      );
    }
    return { text, isJson: false };
  }

  if (
    mimetype.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(ext)
  ) {
    const text = await extractTextFromImageWithOcr(buffer);
    if (!text) {
      throw new AppError(
        400,
        `Could not read text from this image. Supported formats: ${IMPORT_FORMATS_SHORT}. Use a clear, well-lit photo.`,
      );
    }
    return { text, isJson: false };
  }

  if (
    ext.endsWith('.docx') ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();
    if (!text) {
      throw new AppError(400, 'Could not extract text from Word document.');
    }
    return { text, isJson: false };
  }

  if (ext.endsWith('.doc') || mimetype === 'application/msword') {
    const text = await extractDocText(buffer);
    if (!text) {
      throw new AppError(400, 'Could not extract text from Word (.doc) file.');
    }
    return { text, isJson: false };
  }

  throw new AppError(400, `Unsupported file type. Supported formats: ${IMPORT_FORMATS_SHORT}.`);
}

function ensureId<T extends Record<string, unknown>>(item: T): T & { id: string } {
  return { ...item, id: typeof item.id === 'string' ? item.id : uuidv4() };
}

export function normalizeResumeContent(raw: unknown): ResumeContent {
  const content = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const normalized = { ...content };

  if (Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.education)) {
    normalized.education = normalized.education.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (normalized.skills && typeof normalized.skills === 'object') {
    const skills = normalized.skills as Record<string, unknown>;
    if (Array.isArray(skills.technical)) {
      skills.technical = skills.technical.map((item) => {
        if (typeof item === 'string') return { id: uuidv4(), name: item, level: 3 };
        return ensureId(item as Record<string, unknown>);
      });
    }
    if (Array.isArray(skills.soft)) {
      skills.soft = skills.soft.map((item) => {
        if (typeof item === 'string') return { id: uuidv4(), name: item, level: 3 };
        return ensureId(item as Record<string, unknown>);
      });
    }
    normalized.skills = skills;
  }
  if (Array.isArray(normalized.projects)) {
    normalized.projects = normalized.projects.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.certifications)) {
    normalized.certifications = normalized.certifications.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.languages)) {
    normalized.languages = normalized.languages.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.achievements)) {
    normalized.achievements = normalized.achievements.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.publications)) {
    normalized.publications = normalized.publications.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.volunteer)) {
    normalized.volunteer = normalized.volunteer.map((item) => ensureId(item as Record<string, unknown>));
  }
  if (Array.isArray(normalized.customSections)) {
    normalized.customSections = normalized.customSections.map((section) => {
      const sec = section as Record<string, unknown>;
      const items = Array.isArray(sec.items)
        ? sec.items.map((item) => ensureId(item as Record<string, unknown>))
        : [];
      return { ...ensureId(sec), items };
    });
  }

  if (!normalized.sectionOrder) {
    normalized.sectionOrder = [
      'personalInfo', 'summary', 'experience', 'education',
      'skills', 'projects', 'certifications', 'languages',
    ];
  }
  if (!normalized.hiddenSections) {
    normalized.hiddenSections = [];
  }

  return resumeContentSchema.parse(normalized);
}

function parseJsonResume(text: string): ResumeContent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError(400, `Invalid JSON file. Supported formats: ${IMPORT_FORMATS_SHORT}.`);
  }

  const content =
    typeof parsed === 'object' &&
    parsed !== null &&
    'content' in parsed &&
    typeof (parsed as { content?: unknown }).content === 'object'
      ? (parsed as { content: unknown }).content
      : parsed;

  return normalizeResumeContent(content);
}

function hasMeaningfulImportContent(content: ResumeContent): boolean {
  const personal = content.personalInfo;
  if (personal?.firstName?.trim() || personal?.lastName?.trim()) return true;
  if (personal?.email?.trim() || personal?.phone?.trim()) return true;
  if (content.summary?.trim()) return true;
  if ((content.experience?.length ?? 0) > 0) return true;
  if ((content.education?.length ?? 0) > 0) return true;
  if ((content.skills?.technical?.length ?? 0) > 0) return true;
  if ((content.customSections?.length ?? 0) > 0) return true;
  return false;
}

function ensureImportHasContent(rawText: string, content: ResumeContent): ResumeContent {
  if (hasMeaningfulImportContent(content)) {
    return content;
  }

  const trimmed = rawText.trim();
  if (trimmed.length < 20) {
    throw new AppError(
      400,
      `Could not read enough text from this file. Supported formats: ${IMPORT_FORMATS_SHORT}.`,
    );
  }

  return normalizeResumeContent(
    finalizeProfessionalImport({
      ...content,
      summary: trimmed.slice(0, 4000),
      customSections: [
        {
          id: uuidv4(),
          title: 'Imported Document',
          items: [{ id: uuidv4(), content: trimmed.slice(0, 12000) }],
        },
      ],
    }),
  );
}

export function applyUserProfileToImport(
  content: ResumeContent,
  user: { name?: string | null; email?: string | null; phone?: string | null },
): ResumeContent {
  const personalInfo = { ...(content.personalInfo ?? {}) };

  if (isBadParsedName(personalInfo.firstName, personalInfo.lastName) && user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    personalInfo.firstName = parts[0] ?? '';
    personalInfo.lastName = parts.slice(1).join(' ');
  }

  if (!personalInfo.email && user.email) personalInfo.email = user.email;
  if (!personalInfo.phone && user.phone) personalInfo.phone = user.phone;

  return { ...content, personalInfo };
}

export async function parseImportedResume(
  userId: string,
  text: string,
  isJson: boolean,
): Promise<ResumeContent> {
  if (isJson) {
    return parseJsonResume(text);
  }

  let content: ResumeContent;

  if (env.OPENAI_API_KEY) {
    try {
      content = await AIService.parseResumeFromText(userId, text);
    } catch {
      content = normalizeResumeContent(basicParseResumeText(text));
    }
  } else {
    content = normalizeResumeContent(basicParseResumeText(text));
  }

  return ensureImportHasContent(text, normalizeResumeContent(enrichImportedContent(text, content)));
}
