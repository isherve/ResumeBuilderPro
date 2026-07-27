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
} from './resumeImport.parser.js';
import {
  extractTextFromImageWithOcr,
  extractTextFromPdfWithOcr,
} from './pdfOcr.service.js';

const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.json', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp'];

export function isSupportedImportFile(mimetype: string, filename: string): boolean {
  const ext = filename.toLowerCase();
  return (
    SUPPORTED_EXTENSIONS.some((suffix) => ext.endsWith(suffix)) ||
    mimetype === 'application/pdf' ||
    mimetype === 'text/plain' ||
    mimetype === 'application/json' ||
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype.startsWith('image/')
  );
}

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
        'Could not read this PDF. If it is a scan, try uploading a JPG/PNG photo of your CV, a Word (.docx) file, or re-export the PDF with selectable text.',
      );
    }
    return { text, isJson: false };
  }

  if (mimetype.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(ext)) {
    const text = await extractTextFromImageWithOcr(buffer);
    if (!text) {
      throw new AppError(
        400,
        'Could not read text from this image. Use a clear, well-lit photo or upload a Word (.docx) file instead.',
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

  throw new AppError(400, 'Unsupported file type. Upload PDF, Word (.doc/.docx), TXT, or JSON.');
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
    throw new AppError(400, 'Invalid JSON file. Export a resume as JSON or upload PDF/DOCX/TXT.');
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

  return normalizeResumeContent(enrichImportedContent(text, content));
}
