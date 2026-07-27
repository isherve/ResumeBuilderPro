import { generateId } from '@/lib/utils';
import type { ResumeContent, Template, User } from '@/types';

/** Rich sample content for template previews and new resumes */
export const previewSampleContent: ResumeContent = {
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 123-4567',
    city: 'New York, NY',
    jobTitle: 'Senior Product Manager',
    linkedin: 'linkedin.com/in/alexmorgan',
  },
  summary:
    'Strategic product leader with 8+ years driving user-centric solutions across SaaS and fintech. Proven track record of launching products that increase revenue and improve customer retention.',
  experience: [
    {
      id: 'sample-exp-1',
      jobTitle: 'Senior Product Manager',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      startDate: '2021',
      endDate: '',
      isCurrent: true,
      responsibilities: [
        'Led cross-functional team of 12 to deliver flagship mobile app (500K+ users)',
        'Increased conversion rate by 34% through data-driven UX improvements',
      ],
    },
    {
      id: 'sample-exp-2',
      jobTitle: 'Product Manager',
      company: 'StartupXYZ',
      location: 'Remote',
      startDate: '2018',
      endDate: '2021',
      responsibilities: [
        'Owned product roadmap from MVP to Series B funding',
        'Reduced churn by 22% with onboarding redesign',
      ],
    },
  ],
  education: [
    {
      id: 'sample-edu-1',
      degree: 'B.S. Computer Science',
      institution: 'State University',
      startDate: '2014',
      endDate: '2018',
      gpa: '3.8',
    },
  ],
  skills: {
    technical: [
      { id: 's1', name: 'Product Strategy', level: 5 },
      { id: 's2', name: 'Agile / Scrum', level: 5 },
      { id: 's3', name: 'SQL & Analytics', level: 4 },
      { id: 's4', name: 'Figma', level: 4 },
    ],
    soft: [
      { id: 's5', name: 'Leadership', level: 5 },
      { id: 's6', name: 'Communication', level: 5 },
    ],
  },
  languages: [{ id: 'l1', name: 'English', level: 'native' }],
  sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'languages'],
  hiddenSections: [],
};

export function buildStarterContent(user?: User | null, template?: Template): ResumeContent {
  const nameParts = user?.name?.trim().split(/\s+/) ?? [];
  const firstName = nameParts[0] || 'Your';
  const lastName = nameParts.slice(1).join(' ') || 'Name';

  const category = template?.category?.toLowerCase() ?? 'professional';
  const jobTitle = getJobTitleForCategory(category);
  const summary = getSummaryForCategory(category, jobTitle);

  return {
    personalInfo: {
      firstName,
      lastName,
      email: user?.email || 'you@email.com',
      phone: user?.phone || '',
      city: '',
      jobTitle,
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      website: user?.website || '',
      portfolio: user?.portfolio || '',
    },
    summary,
    experience: [
      {
        id: generateId(),
        jobTitle,
        company: 'Company Name',
        location: 'City, Country',
        startDate: '2022',
        endDate: '',
        isCurrent: true,
        responsibilities: [
          'Describe a key achievement using numbers and impact (e.g. increased sales by 25%)',
          'Highlight leadership, collaboration, or technical skills relevant to your target role',
          'Mention tools, methods, or outcomes that match the job you want',
        ],
      },
      {
        id: generateId(),
        jobTitle: `Junior ${jobTitle.split(' ').slice(-1)[0] || 'Role'}`,
        company: 'Previous Company',
        location: 'City, Country',
        startDate: '2019',
        endDate: '2022',
        responsibilities: [
          'Add 2–3 bullet points about projects, responsibilities, or results',
          'Use action verbs: Led, Built, Improved, Delivered, Optimized',
        ],
      },
    ],
    education: [
      {
        id: generateId(),
        degree: 'Bachelor\'s Degree — Field of Study',
        institution: 'University Name',
        location: 'City, Country',
        startDate: '2015',
        endDate: '2019',
        gpa: '',
      },
    ],
    skills: {
      technical: getSkillsForCategory(category).map((name) => ({
        id: generateId(),
        name,
        level: 4,
      })),
      soft: [
        { id: generateId(), name: 'Communication', level: 5 },
        { id: generateId(), name: 'Teamwork', level: 5 },
        { id: generateId(), name: 'Problem Solving', level: 4 },
      ],
    },
    languages: [{ id: generateId(), name: 'English', level: 'professional' }],
    projects: [],
    sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'languages'],
    hiddenSections: [],
  };
}

function getJobTitleForCategory(category: string): string {
  const map: Record<string, string> = {
    developer: 'Software Engineer',
    engineer: 'Mechanical Engineer',
    designer: 'UX/UI Designer',
    marketing: 'Marketing Specialist',
    finance: 'Financial Analyst',
    medical: 'Healthcare Professional',
    legal: 'Legal Associate',
    student: 'Graduate / Entry Level',
    academic: 'Research Assistant',
    corporate: 'Business Analyst',
    executive: 'Director of Operations',
    creative: 'Creative Director',
  };
  return map[category] ?? 'Professional';
}

function getSummaryForCategory(category: string, jobTitle: string): string {
  return `Motivated ${jobTitle.toLowerCase()} with a strong foundation in ${category} work. Skilled at delivering quality results, collaborating with teams, and adapting quickly to new challenges. Seeking to contribute expertise and grow with a forward-thinking organization.`;
}

function getSkillsForCategory(category: string): string[] {
  const map: Record<string, string[]> = {
    developer: ['JavaScript', 'React', 'Node.js', 'Git', 'SQL', 'TypeScript'],
    designer: ['Figma', 'Adobe XD', 'UI Design', 'Prototyping', 'Design Systems'],
    marketing: ['SEO', 'Google Analytics', 'Content Strategy', 'Social Media', 'Copywriting'],
    finance: ['Excel', 'Financial Modeling', 'Budgeting', 'Reporting', 'SAP'],
    student: ['Microsoft Office', 'Research', 'Presentation', 'Team Projects'],
    corporate: ['Project Management', 'Stakeholder Management', 'Excel', 'PowerPoint'],
  };
  return map[category] ?? ['Microsoft Office', 'Communication', 'Project Management', 'Analysis'];
}

export function getLayoutType(theme: { headerStyle?: string; sectionStyle?: string }, layout?: Record<string, unknown>): 'sidebar' | 'minimal' | 'centered' {
  if (theme.headerStyle === 'sidebar' || layout?.type === 'sidebar') return 'sidebar';
  if (theme.sectionStyle === 'minimal' || theme.headerStyle === 'minimal') return 'minimal';
  return 'centered';
}
