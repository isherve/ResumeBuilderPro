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
}
