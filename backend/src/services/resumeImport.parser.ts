import { v4 as uuidv4 } from 'uuid';
import type { ResumeContent } from '../validators/resume.validator.js';

export type ParsedSection = {
  key: string;
  title: string;
  lines: string[];
};

const SECTION_KEYWORDS = new Set([
  'personality',
  'summary',
  'profile',
  'objective',
  'about',
  'experience',
  'work experience',
  'professional experience',
  'employment',
  'education',
  'academic records',
  'academic background',
  'academic qualifications',
  'qualifications',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'awards',
  'publications',
  'research',
  'volunteer',
  'references',
  'training',
  'interests',
  'hobbies',
  'conferences',
  'seminars',
  'membership',
  'affiliations',
  'curriculum vitae',
  'resume',
  'cv',
]);

const SECTION_TARGETS: Record<string, SectionTarget> = {
  personality: 'custom',
  summary: 'summary',
  profile: 'summary',
  'professional summary': 'summary',
  objective: 'summary',
  about: 'summary',
  biography: 'summary',
  overview: 'summary',
  experience: 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  employment: 'experience',
  'employment history': 'experience',
  'work history': 'experience',
  career: 'experience',
  positions: 'experience',
  internships: 'experience',
  'teaching experience': 'experience',
  'research experience': 'experience',
  education: 'education',
  'academic records': 'education',
  'academic background': 'education',
  'academic qualifications': 'education',
  qualifications: 'education',
  'educational background': 'education',
  training: 'education',
  'professional training': 'education',
  degrees: 'education',
  schooling: 'education',
  skills: 'skills',
  'technical skills': 'skills',
  competencies: 'skills',
  expertise: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  certificates: 'certifications',
  licenses: 'certifications',
  languages: 'languages',
  'language skills': 'languages',
  achievements: 'achievements',
  accomplishments: 'achievements',
  honors: 'achievements',
  awards: 'achievements',
  publications: 'publications',
  research: 'publications',
  papers: 'publications',
  volunteer: 'volunteer',
  'volunteer work': 'volunteer',
  'community service': 'volunteer',
  references: 'references',
};

type SectionTarget =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'publications'
  | 'volunteer'
  | 'references'
  | 'custom';

const BAD_NAME_WORDS = new Set([
  'personality',
  'experience',
  'education',
  'skills',
  'summary',
  'profile',
  'objective',
  'curriculum',
  'vitae',
  'resume',
  'cv',
  'references',
  'publications',
]);

export function normalizeSectionKey(line: string): string {
  return line
    .replace(/[:\s]+$/, '')
    .replace(/^[IVXLC]+\.\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim()
    .toLowerCase();
}

function isKnownSectionKey(key: string): boolean {
  if (SECTION_KEYWORDS.has(key)) return true;
  return Object.keys(SECTION_TARGETS).some(
    (pattern) => key === pattern || key.startsWith(`${pattern} `) || key.startsWith(`${pattern}:`),
  );
}

export function isSectionHeaderLine(line: string): boolean {
  const cleaned = line.replace(/[:\s]+$/, '').trim();
  if (!cleaned || cleaned.length > 80) return false;

  if (/^[IVXLC]+\.\s+\S/i.test(cleaned)) return true;
  if (/^\d+\.\s+\S/.test(cleaned)) return true;

  const key = normalizeSectionKey(cleaned);
  if (isKnownSectionKey(key)) return true;

  if (
    cleaned.length <= 45 &&
    /^[A-Z][A-Z\s&\-\/\.]+$/.test(cleaned) &&
    /\b(RECORDS|EXPERIENCE|EDUCATION|SKILLS|BACKGROUND|QUALIFICATIONS|PERSONALITY|PUBLICATIONS|TRAINING|LANGUAGES|REFERENCES|ACHIEVEMENTS|AWARDS|PROJECTS|MEMBERSHIP|AFFILIATIONS|CONFERENCES|SEMINARS|INTERNSHIP|EMPLOYMENT|VOLUNTEER|RESEARCH|BIOGRAPHY|OVERVIEW)\b/.test(
      cleaned,
    )
  ) {
    return true;
  }

  return /^(experience|work experience|employment|education|skills|summary|profile|objective|projects|certifications|languages|achievements|awards|volunteer|references|curriculum vitae|cv)\b/i.test(
    cleaned,
  );
}

function parseSectionHeader(line: string): { key: string; title: string } | null {
  const cleaned = line.replace(/[:\s]+$/, '').trim();
  if (!cleaned) return null;

  const roman = cleaned.match(/^([IVXLC]+)\.\s*(.+)$/i);
  if (roman) {
    const title = roman[2].trim();
    return { key: normalizeSectionKey(title), title };
  }

  const numbered = cleaned.match(/^(\d+)\.\s*(.+)$/);
  if (numbered) {
    const title = numbered[2].trim();
    return { key: normalizeSectionKey(title), title };
  }

  if (isSectionHeaderLine(cleaned)) {
    return { key: normalizeSectionKey(cleaned), title: cleaned };
  }

  return null;
}

export function splitTextIntoSections(text: string): ParsedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current) current.lines.push('');
      continue;
    }

    const header = parseSectionHeader(line);
    if (header) {
      if (current) sections.push(current);
      current = { key: header.key, title: header.title, lines: [] };
      continue;
    }

    if (!current) {
      current = { key: '_header', title: 'Header', lines: [] };
    }
    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function resolveSectionTarget(key: string): SectionTarget {
  if (SECTION_TARGETS[key]) return SECTION_TARGETS[key];
  for (const [pattern, target] of Object.entries(SECTION_TARGETS)) {
    if (key === pattern || key.startsWith(`${pattern} `) || key.startsWith(`${pattern}:`)) {
      return target;
    }
  }
  return 'custom';
}

function isContactLine(line: string): boolean {
  return /[@]|linkedin|github|http|www\./i.test(line) || /\+?\d[\d\s\-().]{7,}/.test(line);
}

export function isPersonNameLine(line: string): boolean {
  if (line.length < 4 || line.length > 55) return false;
  if (isContactLine(line)) return false;
  if (isSectionHeaderLine(line)) return false;

  const key = normalizeSectionKey(line);
  if (BAD_NAME_WORDS.has(key) || isKnownSectionKey(key)) return false;

  const parts = line.replace(/^(curriculum vitae|resume|cv)\s*/i, '').split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 6) return false;

  return parts.every((part) => /^[\p{L}][\p{L}\-'.]*$/u.test(part));
}

export function extractNameFromLines(lines: string[]): {
  firstName: string;
  lastName: string;
  jobTitle: string;
} {
  const candidates = lines.filter((line) => line && !isContactLine(line));

  for (let i = 0; i < Math.min(candidates.length, 12); i += 1) {
    const line = candidates[i];
    if (!isPersonNameLine(line)) continue;

    const parts = line.split(/\s+/).filter(Boolean);
    const nextLine = candidates[i + 1];
    const jobTitle =
      nextLine &&
      !isPersonNameLine(nextLine) &&
      !isSectionHeaderLine(nextLine) &&
      nextLine.length < 80
        ? nextLine
        : '';

    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
      jobTitle,
    };
  }

  return { firstName: '', lastName: '', jobTitle: '' };
}

function compactLines(lines: string[]): string[] {
  return lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function bulletLines(lines: string[]): string[] {
  return lines
    .flatMap((line) => line.split(/\n/))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*▪▫◦]\s*/, ''));
}

function linesToExperienceEntries(lines: string[]) {
  const blocks = compactLines(lines);
  if (!blocks.length) return [];

  return blocks.map((block) => {
    const blockLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const bullets = blockLines.filter((line) => /^[-•*]/.test(line)).map((line) => line.replace(/^[-•*]\s*/, ''));
    const nonBullets = blockLines.filter((line) => !/^[-•*]/.test(line));
    const dates = block.match(/\b(19|20)\d{2}\b(?:\s*[-–—]\s*\b(?:present|(19|20)\d{2})\b)?/gi);

    return {
      id: uuidv4(),
      jobTitle: nonBullets[0] ?? 'Role',
      company: nonBullets[1] ?? nonBullets[0] ?? 'Organization',
      location: nonBullets[2] ?? '',
      startDate: dates?.[0]?.split(/[-–—]/)[0]?.trim() ?? '',
      endDate: dates?.[0]?.includes('-') ? dates[0].split(/[-–—]/).slice(1).join('-').trim() : '',
      isCurrent: /present/i.test(block),
      responsibilities: bullets.length ? bullets : nonBullets.slice(2),
    };
  });
}

function linesToEducationEntries(lines: string[]) {
  const blocks = compactLines(lines);
  if (!blocks.length) {
    const flat = bulletLines(lines);
    if (!flat.length) return [];
    return flat.map((line) => ({
      id: uuidv4(),
      degree: line,
      institution: '',
      startDate: line.match(/\b(19|20)\d{2}\b/)?.[0] ?? '',
      description: '',
    }));
  }

  return blocks.map((block) => {
    const blockLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const dates = block.match(/\b(19|20)\d{2}\b/g) ?? [];
    return {
      id: uuidv4(),
      degree: blockLines[0] ?? 'Qualification',
      institution: blockLines[1] ?? '',
      startDate: dates[0] ?? '',
      endDate: dates[1] ?? '',
      description: blockLines.slice(2).join('\n'),
    };
  });
}

function linesToSkillItems(lines: string[]) {
  return bulletLines(lines)
    .join(', ')
    .split(/[,;|/]/)
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 1 && skill.length < 50 && !/^[\d\s]+$/.test(skill))
    .slice(0, 30)
    .map((name) => ({ id: uuidv4(), name, level: 3 }));
}

function linesToCustomItems(lines: string[]) {
  const content = bulletLines(lines).join('\n').trim();
  if (!content) return [];
  return compactLines(lines).map((block) => ({
    id: uuidv4(),
    content: block,
  }));
}

function linesToProjectEntries(lines: string[]) {
  return compactLines(lines).map((block) => ({
    id: uuidv4(),
    name: block.split('\n')[0] ?? 'Project',
    description: block.split('\n').slice(1).join('\n'),
    technologies: [],
  }));
}

function linesToPublicationEntries(lines: string[]) {
  return bulletLines(lines).map((line) => ({
    id: uuidv4(),
    title: line,
  }));
}

function linesToAchievementEntries(lines: string[]) {
  return bulletLines(lines).map((line) => ({
    id: uuidv4(),
    title: line,
  }));
}

function linesToLanguageEntries(lines: string[]) {
  return bulletLines(lines).map((line) => {
    const [name, levelText] = line.split(/[:\-–—]/).map((part) => part.trim());
    const level = /native|fluent|mother/i.test(levelText ?? line)
      ? 'native'
      : /professional|advanced|intermediate/i.test(levelText ?? line)
        ? 'professional'
        : 'basic';
    return { id: uuidv4(), name: name || line, level: level as 'native' | 'professional' | 'basic' };
  });
}

function linesToCertificationEntries(lines: string[]) {
  return bulletLines(lines).map((line) => ({
    id: uuidv4(),
    name: line,
    issuer: '',
  }));
}

function linesToVolunteerEntries(lines: string[]) {
  return compactLines(lines).map((block) => {
    const blockLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    return {
      id: uuidv4(),
      role: blockLines[0] ?? 'Volunteer',
      organization: blockLines[1] ?? '',
      description: blockLines.slice(2).join('\n'),
    };
  });
}

function appendSummary(existing: string | undefined, addition: string): string {
  const body = stripSectionHeadersFromText(addition);
  if (!body) return existing ?? '';
  if (!existing?.trim()) return body;
  if (existing.includes(body)) return existing;
  return `${existing.trim()}\n\n${body}`;
}

function stripSectionHeadersFromText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !isSectionHeaderLine(line))
    .join('\n')
    .trim();
}

function cleanSummaryText(text?: string): string | undefined {
  if (!text?.trim()) return undefined;
  const cleaned = stripSectionHeadersFromText(text);
  if (!cleaned || isBadSummary(cleaned)) return undefined;
  return cleaned;
}

function pickList<T>(primary: T[] | undefined, fallback: T[] | undefined): T[] | undefined {
  if (primary?.length) return primary;
  if (fallback?.length) return fallback;
  return undefined;
}

function contentFingerprint(content: ResumeContent): string {
  const parts = [
    content.summary ?? '',
    ...(content.experience ?? []).flatMap((item) => [
      item.jobTitle,
      item.company,
      ...(item.responsibilities ?? []),
    ]),
    ...(content.education ?? []).flatMap((item) => [
      item.degree,
      item.institution,
      item.description ?? '',
    ]),
    ...(content.skills?.technical ?? []).map((skill) => skill.name),
  ];
  return parts.join('\n').toLowerCase();
}

function dedupeCustomSections(content: ResumeContent): ResumeContent['customSections'] {
  const fingerprint = contentFingerprint(content);
  const sections = content.customSections ?? [];
  const seen = new Set<string>();

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const normalized = item.content.trim().toLowerCase();
        if (!normalized) return false;
        if (seen.has(normalized)) return false;
        if (normalized.length > 20 && fingerprint.includes(normalized.slice(0, Math.min(normalized.length, 80)))) {
          return false;
        }
        seen.add(normalized);
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

const PROFESSIONAL_SECTION_ORDER = [
  'personalInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'languages',
  'projects',
  'achievements',
  'publications',
  'volunteer',
  'customSections',
] as const;

export function finalizeProfessionalImport(content: ResumeContent): ResumeContent {
  const result: ResumeContent = {
    ...content,
    summary: cleanSummaryText(content.summary),
    customSections: dedupeCustomSections(content),
  };

  const visibleSections = PROFESSIONAL_SECTION_ORDER.filter((key) => {
    switch (key) {
      case 'personalInfo':
        return Boolean(result.personalInfo);
      case 'summary':
        return Boolean(result.summary?.trim());
      case 'experience':
        return (result.experience?.length ?? 0) > 0;
      case 'education':
        return (result.education?.length ?? 0) > 0;
      case 'skills':
        return (result.skills?.technical?.length ?? 0) > 0 || (result.skills?.soft?.length ?? 0) > 0;
      case 'certifications':
        return (result.certifications?.length ?? 0) > 0;
      case 'languages':
        return (result.languages?.length ?? 0) > 0;
      case 'projects':
        return (result.projects?.length ?? 0) > 0;
      case 'achievements':
        return (result.achievements?.length ?? 0) > 0;
      case 'publications':
        return (result.publications?.length ?? 0) > 0;
      case 'volunteer':
        return (result.volunteer?.length ?? 0) > 0;
      case 'customSections':
        return (result.customSections?.length ?? 0) > 0;
      default:
        return false;
    }
  });

  result.sectionOrder = [...visibleSections];
  result.hiddenSections = [...(result.hiddenSections ?? []), 'references'].filter(
    (section, index, list) => list.indexOf(section) === index,
  );

  return result;
}

export function isBadParsedName(firstName?: string, lastName?: string): boolean {
  const fn = (firstName ?? '').trim().toLowerCase();
  const ln = (lastName ?? '').trim().toLowerCase();
  if (!fn) return true;
  if (BAD_NAME_WORDS.has(fn)) return true;
  if (fn.length <= 2 && !ln) return true;
  if (isKnownSectionKey(normalizeSectionKey(`${fn} ${ln}`.trim()))) return true;
  return false;
}

function isBadSummary(summary?: string): boolean {
  if (!summary?.trim()) return true;
  const trimmed = summary.trim();
  if (isSectionHeaderLine(trimmed)) return true;
  if (/^[IVXLC]+\.\s/i.test(trimmed)) return true;
  return trimmed.length < 24 && isKnownSectionKey(normalizeSectionKey(trimmed));
}

export function buildContentFromSections(sections: ParsedSection[]): Partial<ResumeContent> {
  const headerSection = sections.find((section) => section.key === '_header');
  const headerLines = headerSection?.lines.filter(Boolean) ?? [];
  const extractedName = extractNameFromLines(headerLines);

  const content: Partial<ResumeContent> = {
    personalInfo: {
      firstName: extractedName.firstName,
      lastName: extractedName.lastName,
      jobTitle: extractedName.jobTitle,
    },
    summary: '',
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    publications: [],
    volunteer: [],
    customSections: [],
  };

  for (const section of sections) {
    if (section.key === '_header') continue;
    const body = section.lines.join('\n').trim();
    if (!body) continue;

    const target = resolveSectionTarget(section.key);

    switch (target) {
      case 'summary':
        content.summary = appendSummary(content.summary, body);
        break;
      case 'experience':
        content.experience = [...(content.experience ?? []), ...linesToExperienceEntries(section.lines)];
        break;
      case 'education':
        content.education = [...(content.education ?? []), ...linesToEducationEntries(section.lines)];
        break;
      case 'skills':
        content.skills = {
          technical: [
            ...(content.skills?.technical ?? []),
            ...linesToSkillItems(section.lines),
          ],
          soft: content.skills?.soft ?? [],
        };
        break;
      case 'projects':
        content.projects = [...(content.projects ?? []), ...linesToProjectEntries(section.lines)];
        break;
      case 'certifications':
        content.certifications = [
          ...(content.certifications ?? []),
          ...linesToCertificationEntries(section.lines),
        ];
        break;
      case 'languages':
        content.languages = [...(content.languages ?? []), ...linesToLanguageEntries(section.lines)];
        break;
      case 'achievements':
        content.achievements = [
          ...(content.achievements ?? []),
          ...linesToAchievementEntries(section.lines),
        ];
        break;
      case 'publications':
        content.publications = [
          ...(content.publications ?? []),
          ...linesToPublicationEntries(section.lines),
        ];
        break;
      case 'volunteer':
        content.volunteer = [...(content.volunteer ?? []), ...linesToVolunteerEntries(section.lines)];
        break;
      case 'references':
      case 'custom':
      default: {
        const items = linesToCustomItems(section.lines);
        if (items.length) {
          content.customSections = [
            ...(content.customSections ?? []),
            { id: uuidv4(), title: section.title, items },
          ];
        }
        break;
      }
    }
  }

  return content;
}

export function enrichImportedContent(rawText: string, parsed: ResumeContent): ResumeContent {
  const sections = splitTextIntoSections(rawText);
  const fromSections = buildContentFromSections(sections);

  const headerLines = sections.find((section) => section.key === '_header')?.lines.filter(Boolean) ?? [];
  const extractedName = extractNameFromLines(headerLines);

  const personalInfo = { ...(parsed.personalInfo ?? {}) };

  if (isBadParsedName(personalInfo.firstName, personalInfo.lastName) && extractedName.firstName) {
    personalInfo.firstName = extractedName.firstName;
    personalInfo.lastName = extractedName.lastName;
    if (!personalInfo.jobTitle && extractedName.jobTitle) {
      personalInfo.jobTitle = extractedName.jobTitle;
    }
  }

  const emailMatch = rawText.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{3,4}[\s-]?\d{0,4}/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/github\.com\/[\w-]+/i);

  if (!personalInfo.email && emailMatch) personalInfo.email = emailMatch[0];
  if (!personalInfo.phone && phoneMatch) personalInfo.phone = phoneMatch[0].trim();
  if (!personalInfo.linkedin && linkedinMatch) personalInfo.linkedin = `https://${linkedinMatch[0]}`;
  if (!personalInfo.github && githubMatch) personalInfo.github = `https://${githubMatch[0]}`;

  const enriched: ResumeContent = finalizeProfessionalImport({
    ...parsed,
    personalInfo,
    summary:
      isBadSummary(parsed.summary) && fromSections.summary?.trim()
        ? cleanSummaryText(fromSections.summary)
        : cleanSummaryText(parsed.summary),
    experience: pickList(parsed.experience, fromSections.experience),
    education: pickList(parsed.education, fromSections.education),
    skills: {
      technical: pickList(parsed.skills?.technical, fromSections.skills?.technical) ?? [],
      soft: parsed.skills?.soft ?? [],
    },
    projects: pickList(parsed.projects, fromSections.projects),
    certifications: pickList(parsed.certifications, fromSections.certifications),
    languages: pickList(parsed.languages, fromSections.languages),
    achievements: pickList(parsed.achievements, fromSections.achievements),
    publications: pickList(parsed.publications, fromSections.publications),
    volunteer: pickList(parsed.volunteer, fromSections.volunteer),
    customSections: pickList(parsed.customSections, fromSections.customSections),
  });

  return enriched;
}

export function basicParseResumeText(text: string): ResumeContent {
  const sections = splitTextIntoSections(text);
  const fromSections = buildContentFromSections(sections);

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{3,4}[\s-]?\d{0,4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  return finalizeProfessionalImport({
    personalInfo: {
      ...fromSections.personalInfo,
      email: emailMatch?.[0] ?? '',
      phone: phoneMatch?.[0]?.trim() ?? '',
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
      github: githubMatch ? `https://${githubMatch[0]}` : '',
    },
    summary: fromSections.summary ?? '',
    experience: fromSections.experience ?? [],
    education: fromSections.education ?? [],
    skills: fromSections.skills ?? { technical: [], soft: [] },
    projects: fromSections.projects ?? [],
    certifications: fromSections.certifications ?? [],
    languages: fromSections.languages ?? [],
    achievements: fromSections.achievements ?? [],
    publications: fromSections.publications ?? [],
    volunteer: fromSections.volunteer ?? [],
    customSections: fromSections.customSections ?? [],
    hiddenSections: [],
  });
}
