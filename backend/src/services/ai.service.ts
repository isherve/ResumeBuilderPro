import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../lib/prisma.js';

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const trackUsage = async (userId: string, feature: string, tokens: number, metadata?: object) => {
  await prisma.aIUsage.create({
    data: { userId, feature, tokens, metadata: metadata || {} },
  });

  await prisma.activity.create({
    data: { userId, type: 'AI_USED', metadata: { feature, tokens } },
  });
};

export class AIService {
  private static ensureOpenAI() {
    if (!openai) {
      throw new AppError(503, 'AI service is not configured. Please set OPENAI_API_KEY.');
    }
    return openai;
  }

  static async generateSummary(userId: string, data: {
    jobTitle: string;
    experience: string;
    skills: string[];
  }) {
    const client = this.ensureOpenAI();
    const prompt = `Write a professional resume summary for a ${data.jobTitle} with experience: ${data.experience}. Key skills: ${data.skills.join(', ')}. Keep it 3-4 sentences, ATS-friendly, and impactful.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    await trackUsage(userId, 'generate_summary', response.usage?.total_tokens || 0);

    return { summary: content.trim() };
  }

  static async improveBullet(userId: string, bullet: string, jobTitle?: string) {
    const client = this.ensureOpenAI();
    const prompt = `Improve this resume bullet point to be more impactful and ATS-friendly${jobTitle ? ` for a ${jobTitle} role` : ''}. Use action verbs and quantify where possible. Return only the improved bullet:\n\n${bullet}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || bullet;
    await trackUsage(userId, 'improve_bullet', response.usage?.total_tokens || 0);

    return { bullet: content.trim() };
  }

  static async rewriteBullets(userId: string, bullets: string[], jobTitle?: string) {
    const client = this.ensureOpenAI();
    const prompt = `Rewrite these resume bullet points to be more impactful and ATS-friendly${jobTitle ? ` for a ${jobTitle} role` : ''}. Return as JSON array of strings:\n\n${JSON.stringify(bullets)}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"bullets":[]}';
    await trackUsage(userId, 'rewrite_bullets', response.usage?.total_tokens || 0);

    try {
      const parsed = JSON.parse(content);
      return { bullets: parsed.bullets || bullets };
    } catch {
      return { bullets };
    }
  }

  static async suggestSkills(userId: string, jobTitle: string, existingSkills: string[]) {
    const client = this.ensureOpenAI();
    const prompt = `Suggest 10 relevant skills for a ${jobTitle} resume. Existing skills: ${existingSkills.join(', ')}. Return JSON with "technical" and "soft" arrays.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    await trackUsage(userId, 'suggest_skills', response.usage?.total_tokens || 0);

    return JSON.parse(content);
  }

  static async generateCoverLetter(userId: string, data: {
    resumeContent: string;
    jobDescription: string;
    companyName: string;
  }) {
    const client = this.ensureOpenAI();
    const prompt = `Write a professional cover letter based on this resume:\n${data.resumeContent}\n\nFor this job at ${data.companyName}:\n${data.jobDescription}\n\nKeep it professional, 3-4 paragraphs.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '';
    await trackUsage(userId, 'generate_cover_letter', response.usage?.total_tokens || 0);

    return { coverLetter: content.trim() };
  }

  static async grammarCorrection(userId: string, text: string) {
    const client = this.ensureOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Correct grammar and improve clarity of this resume text. Return only the corrected text:\n\n${text}`,
      }],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || text;
    await trackUsage(userId, 'grammar_correction', response.usage?.total_tokens || 0);

    return { corrected: content.trim() };
  }

  static async reviewResume(userId: string, resumeContent: string) {
    const client = this.ensureOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Review this resume content and provide constructive feedback. Return JSON with "score" (0-100), "strengths" (array), "improvements" (array), "suggestions" (array):\n\n${resumeContent}`,
      }],
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    await trackUsage(userId, 'review_resume', response.usage?.total_tokens || 0);

    return JSON.parse(content);
  }

  static async parseResumeFromText(userId: string, rawText: string) {
    const client = this.ensureOpenAI();
    const trimmed = rawText.slice(0, 16000);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You extract structured resume/CV data from raw text. Return ONLY valid JSON matching this shape:
{
  "personalInfo": { "firstName", "lastName", "email", "phone", "address", "city", "country", "website", "linkedin", "github", "portfolio", "jobTitle" },
  "summary": "string",
  "experience": [{ "id": "uuid", "jobTitle", "company", "location", "startDate", "endDate", "isCurrent", "responsibilities": ["..."], "achievements": ["..."] }],
  "education": [{ "id": "uuid", "degree", "institution", "location", "startDate", "endDate", "gpa", "description" }],
  "skills": { "technical": [{ "id": "uuid", "name", "level": 1-5 }], "soft": [{ "id": "uuid", "name", "level": 1-5 }] },
  "projects": [{ "id": "uuid", "name", "description", "technologies": ["..."] }],
  "certifications": [{ "id": "uuid", "name", "issuer", "issueDate" }],
  "languages": [{ "id": "uuid", "name", "level": "native|professional|basic" }],
  "achievements": [{ "id": "uuid", "title", "description", "date" }],
  "publications": [{ "id": "uuid", "title", "publisher", "date", "url" }],
  "volunteer": [{ "id": "uuid", "role", "organization", "startDate", "endDate", "description" }],
  "customSections": [{ "id": "uuid", "title", "items": [{ "id": "uuid", "content": "..." }] }]
}

Rules:
- The person's full name is usually at the top — never use section titles like "PERSONALITY", "ACADEMIC RECORDS", or Roman numeral headings as firstName/lastName.
- Academic CVs may use numbered sections (e.g. "I. PERSONALITY", "II. ACADEMIC RECORDS"). Map personality/profile text to summary, academic records/qualifications to education, work/professional experience to experience.
- Capture ALL substantive content. Put unmatched sections in customSections rather than dropping text.
- Create multiple experience and education entries when the CV lists several roles or degrees.
- Generate UUIDs for all id fields. Use empty strings for missing scalar fields and empty arrays for missing lists. Preserve factual content only — do not invent details.`,
      }, {
        role: 'user',
        content: trimmed,
      }],
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    await trackUsage(userId, 'parse_resume', response.usage?.total_tokens || 0, {
      textLength: trimmed.length,
    });

    const { normalizeResumeContent } = await import('./resumeImport.service.js');
    return normalizeResumeContent(JSON.parse(content));
  }
}
