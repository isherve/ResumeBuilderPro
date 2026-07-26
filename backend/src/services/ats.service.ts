import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface ATSAnalysis {
  overallScore: number;
  keywords: { found: string[]; missing: string[]; score: number };
  formatting: { score: number; issues: string[] };
  sections: { score: number; present: string[]; missing: string[] };
  length: { score: number; wordCount: number; recommendation: string };
  readability: { score: number; gradeLevel: string };
  suggestions: string[];
}

const REQUIRED_SECTIONS = ['personalInfo', 'summary', 'experience', 'education', 'skills'];
const COMMON_KEYWORDS = [
  'leadership', 'management', 'communication', 'teamwork', 'problem solving',
  'analytical', 'project management', 'strategic planning', 'collaboration',
  'innovation', 'results-driven', 'detail-oriented', 'cross-functional',
];

export class ATSService {
  static analyzeContent(content: Record<string, unknown>): ATSAnalysis {
    const text = JSON.stringify(content).toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const foundKeywords = COMMON_KEYWORDS.filter((kw) => text.includes(kw));
    const missingKeywords = COMMON_KEYWORDS.filter((kw) => !text.includes(kw)).slice(0, 5);
    const keywordScore = Math.min(100, Math.round((foundKeywords.length / 10) * 100));

    const presentSections = REQUIRED_SECTIONS.filter((s) => {
      const section = content[s];
      if (!section) return false;
      if (typeof section === 'string') return section.trim().length > 0;
      if (Array.isArray(section)) return section.length > 0;
      if (typeof section === 'object') return Object.values(section as object).some((v) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      );
      return false;
    });
    const missingSections = REQUIRED_SECTIONS.filter((s) => !presentSections.includes(s));
    const sectionScore = Math.round((presentSections.length / REQUIRED_SECTIONS.length) * 100);

    const formattingIssues: string[] = [];
    if (text.includes('table')) formattingIssues.push('Avoid tables - ATS may not parse them');
    if (text.includes('image') && !(content.personalInfo as Record<string, unknown>)?.photo) {
      formattingIssues.push('Minimize images for better ATS compatibility');
    }
    const formattingScore = Math.max(60, 100 - formattingIssues.length * 15);

    let lengthScore = 100;
    let lengthRecommendation = 'Good length';
    if (wordCount < 200) {
      lengthScore = 50;
      lengthRecommendation = 'Resume is too short. Add more detail to experience and skills.';
    } else if (wordCount > 1500) {
      lengthScore = 70;
      lengthRecommendation = 'Resume may be too long. Consider condensing to 1-2 pages.';
    }

    const readabilityScore = wordCount > 100 ? 85 : 60;
    const gradeLevel = wordCount > 500 ? 'Professional' : 'Basic';

    const suggestions: string[] = [];
    if (missingSections.length > 0) {
      suggestions.push(`Add missing sections: ${missingSections.join(', ')}`);
    }
    if (missingKeywords.length > 0) {
      suggestions.push(`Consider adding keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
    }
    if (!content.summary) {
      suggestions.push('Add a professional summary to improve ATS matching');
    }
    const experience = content.experience as Array<{ responsibilities?: string[] }> | undefined;
    if (experience?.length && experience.every((e) => !e.responsibilities?.length)) {
      suggestions.push('Add bullet points to your work experience');
    }

    const overallScore = Math.round(
      (keywordScore * 0.25 + formattingScore * 0.2 + sectionScore * 0.25 +
       lengthScore * 0.15 + readabilityScore * 0.15),
    );

    return {
      overallScore,
      keywords: { found: foundKeywords, missing: missingKeywords, score: keywordScore },
      formatting: { score: formattingScore, issues: formattingIssues },
      sections: { score: sectionScore, present: presentSections, missing: missingSections },
      length: { score: lengthScore, wordCount, recommendation: lengthRecommendation },
      readability: { score: readabilityScore, gradeLevel },
      suggestions,
    };
  }

  static async analyzeResume(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new AppError(404, 'Resume not found');
    }

    const analysis = this.analyzeContent(resume.content as Record<string, unknown>);

    await prisma.aTSReport.create({
      data: {
        resumeId,
        userId,
        overallScore: analysis.overallScore,
        keywords: analysis.keywords,
        formatting: analysis.formatting,
        sections: analysis.sections,
        length: analysis.length,
        readability: analysis.readability,
        suggestions: analysis.suggestions,
      },
    });

    await prisma.resume.update({
      where: { id: resumeId },
      data: { atsScore: analysis.overallScore },
    });

    await prisma.activity.create({
      data: { userId, type: 'ATS_CHECKED', metadata: { resumeId, score: analysis.overallScore } },
    });

    return analysis;
  }

  static async matchJob(userId: string, resumeId: string, jobDescription: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new AppError(404, 'Resume not found');
    }

    const resumeText = JSON.stringify(resume.content).toLowerCase();
    const jobText = jobDescription.toLowerCase();

    const jobWords = [...new Set(jobText.match(/\b[a-z]{3,}\b/g) || [])];
    const matchedWords = jobWords.filter((w) => resumeText.includes(w));
    const matchPercentage = jobWords.length
      ? Math.round((matchedWords.length / jobWords.length) * 100)
      : 0;

    const skillPatterns = jobText.match(/\b(javascript|python|react|node|aws|sql|java|typescript|docker|kubernetes|agile|scrum)\b/g) || [];
    const uniqueSkills = [...new Set(skillPatterns)];
    const missingSkills = uniqueSkills.filter((s) => !resumeText.includes(s));

    const keywordSuggestions = jobWords
      .filter((w) => !resumeText.includes(w) && w.length > 4)
      .slice(0, 10);

    const result = { matchPercentage, missingSkills, keywordSuggestions, matchedKeywords: matchedWords.slice(0, 20) };

    await prisma.jobMatch.create({
      data: {
        resumeId,
        userId,
        jobDescription,
        matchPercentage,
        missingSkills,
        keywordSuggestions,
      },
    });

    return result;
  }
}
