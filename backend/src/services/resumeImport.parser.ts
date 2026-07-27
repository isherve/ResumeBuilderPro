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
  personality: 'summary',
  summary: 'summary',
  profile: 'summary',
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
    .filter((skill) => skill.length > 1 && skill.length < 50)
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

function appendSummary(existing: string | undefined, addition: string, title?: string): string {
  const chunk = title ? `${title}\n${addition}` : addition;
  if (!chunk.trim()) return existing ?? '';
  if (!existing?.trim()) return chunk.trim();
  if (existing.includes(chunk.trim())) return existing;
  return `${existing.trim()}\n\n${chunk.trim()}`;
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
        content.summary = appendSummary(content.summary, body, section.title);
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

function mergeUniqueById<T extends { id: string }>(existing: T[] | undefined, incoming: T[]): T[] {
  const seen = new Set((existing ?? []).map((item) => item.id));
  return [...(existing ?? []), ...incoming.filter((item) => !seen.has(item.id))];
}

function mergeStringField(existing: string | undefined, incoming: string | undefined): string | undefined {
  if (!incoming?.trim()) return existing;
  if (!existing?.trim()) return incoming.trim();
  if (existing.includes(incoming.trim())) return existing;
  return `${existing.trim()}\n\n${incoming.trim()}`;
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

  const enriched: ResumeContent = {
    ...parsed,
    personalInfo,
    summary:
      isBadSummary(parsed.summary) && fromSections.summary?.trim()
        ? fromSections.summary
        : mergeStringField(parsed.summary, fromSections.summary),
    experience:
      (fromSections.experience?.length ?? 0) > (parsed.experience?.length ?? 0)
        ? fromSections.experience
        : parsed.experience?.length
          ? parsed.experience
          : fromSections.experience,
    education:
      (fromSections.education?.length ?? 0) > (parsed.education?.length ?? 0)
        ? fromSections.education
        : parsed.education?.length
          ? parsed.education
          : fromSections.education,
    skills: {
      technical:
        (parsed.skills?.technical?.length ?? 0) > 0
          ? parsed.skills?.technical
          : fromSections.skills?.technical,
      soft: parsed.skills?.soft ?? [],
    },
    projects: mergeUniqueById(parsed.projects, fromSections.projects ?? []),
    certifications: mergeUniqueById(parsed.certifications, fromSections.certifications ?? []),
    languages: mergeUniqueById(parsed.languages, fromSections.languages ?? []),
    achievements: mergeUniqueById(parsed.achievements, fromSections.achievements ?? []),
    publications: mergeUniqueById(parsed.publications, fromSections.publications ?? []),
    volunteer: mergeUniqueById(parsed.volunteer, fromSections.volunteer ?? []),
    customSections: mergeUniqueById(parsed.customSections, fromSections.customSections ?? []),
  };

  const parsedTextLength =
    (enriched.summary?.length ?? 0) +
    (enriched.experience ?? []).reduce((sum, item) => sum + JSON.stringify(item).length, 0) +
    (enriched.education ?? []).reduce((sum, item) => sum + JSON.stringify(item).length, 0) +
    (enriched.customSections ?? []).reduce(
      (sum, section) => sum + section.items.reduce((inner, item) => inner + item.content.length, 0),
      0,
    );

  if (parsedTextLength < rawText.length * 0.35) {
    const fallbackItems = compactLines(
      sections
        .filter((section) => section.key !== '_header')
        .flatMap((section) => section.lines),
    ).map((block) => ({ id: uuidv4(), content: block }));

    if (fallbackItems.length) {
      enriched.customSections = mergeUniqueById(enriched.customSections, [
        {
          id: uuidv4(),
          title: 'Additional Information',
          items: fallbackItems,
        },
      ]);
    } else if (!enriched.summary?.trim()) {
      enriched.summary = rawText.slice(0, 4000).trim();
    }
  }

  if (!enriched.sectionOrder?.length) {
    enriched.sectionOrder = [
      'personalInfo',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
      'achievements',
      'publications',
      'volunteer',
      'customSections',
    ];
  } else if (
    (enriched.customSections?.length ?? 0) > 0 &&
    !enriched.sectionOrder.includes('customSections')
  ) {
    enriched.sectionOrder = [...enriched.sectionOrder, 'customSections'];
  }

  return enriched;
}

export function basicParseResumeText(text: string): ResumeContent {
  const sections = splitTextIntoSections(text);
  const fromSections = buildContentFromSections(sections);

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{3,4}[\s-]?\d{0,4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  return {
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
    sectionOrder: [
      'personalInfo',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
      'achievements',
      'publications',
      'volunteer',
      'customSections',
    ],
    hiddenSections: [],
  };
}
