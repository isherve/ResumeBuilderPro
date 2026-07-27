import { describe, expect, it } from 'vitest';
import {
  basicParseResumeText,
  enrichImportedContent,
  extractNameFromLines,
  isBadParsedName,
  isSectionHeaderLine,
  splitTextIntoSections,
} from './resumeImport.parser.js';

const ACADEMIC_CV = `
Emmanuel IRADUKUNDA
+250 789871251

I. PERSONALITY
Hardworking and dedicated professional with strong academic background.

II. ACADEMIC RECORDS
Bachelor of Science in Computer Science
University of Rwanda, 2020

Master of Science in Information Technology
University of Kigali, 2023

III. PROFESSIONAL EXPERIENCE
Software Developer
ABC Company, Kigali
2021 - Present
- Built web applications
- Led team of 3 developers

IV. SKILLS
JavaScript, Python, React, Node.js
`.trim();

describe('resumeImport.parser', () => {
  it('detects roman numeral section headers', () => {
    expect(isSectionHeaderLine('I. PERSONALITY')).toBe(true);
    expect(isSectionHeaderLine('II. ACADEMIC RECORDS')).toBe(true);
    expect(isSectionHeaderLine('Emmanuel IRADUKUNDA')).toBe(false);
  });

  it('extracts the real name instead of section titles', () => {
    const sections = splitTextIntoSections(ACADEMIC_CV);
    const header = sections.find((section) => section.key === '_header');
    const name = extractNameFromLines(header?.lines ?? []);

    expect(name.firstName).toBe('Emmanuel');
    expect(name.lastName).toBe('IRADUKUNDA');
    expect(isBadParsedName('PERSONALITY', 'I')).toBe(true);
  });

  it('maps academic CV sections into separate professional fields without mixing', () => {
    const parsed = basicParseResumeText(ACADEMIC_CV);

    expect(parsed.personalInfo?.firstName).toBe('Emmanuel');
    expect(parsed.personalInfo?.lastName).toBe('IRADUKUNDA');
    expect(parsed.personalInfo?.phone).toContain('789871251');
    expect(parsed.summary ?? '').not.toMatch(/PERSONALITY|ACADEMIC RECORDS/i);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills?.technical?.length).toBeGreaterThanOrEqual(4);

    const personalitySection = parsed.customSections?.find((section) =>
      /personality/i.test(section.title),
    );
    expect(personalitySection?.items.some((item) => item.content.includes('Hardworking'))).toBe(true);
    expect(parsed.education?.some((item) => item.degree.includes('Bachelor'))).toBe(true);
    expect(parsed.experience?.some((item) => item.jobTitle.includes('Software Developer'))).toBe(true);
  });

  it('repairs bad AI parse output without mixing sections together', () => {
    const badParsed = {
      personalInfo: {
        firstName: 'PERSONALITY',
        lastName: 'I',
        phone: '+250 789871251',
        jobTitle: 'PERSONALITY I.',
      },
      summary: 'I. ACADEMIC RECORDS',
      experience: [],
      education: [],
    };

    const enriched = enrichImportedContent(ACADEMIC_CV, badParsed);

    expect(enriched.personalInfo?.firstName).toBe('Emmanuel');
    expect(enriched.personalInfo?.lastName).toBe('IRADUKUNDA');
    expect(enriched.education?.length).toBeGreaterThanOrEqual(2);
    expect(enriched.experience?.length).toBeGreaterThanOrEqual(1);
    expect(enriched.summary ?? '').not.toMatch(/ACADEMIC RECORDS|PERSONALITY/i);
    expect(
      enriched.customSections?.some((section) =>
        section.items.some((item) => item.content.includes('Hardworking')),
      ),
    ).toBe(true);
  });
});
