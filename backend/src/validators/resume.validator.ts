import { z } from 'zod';
import { ResumeStatus } from '@prisma/client';

export const resumeContentSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
    photo: z.string().optional(),
    jobTitle: z.string().optional(),
  }).optional(),
  summary: z.string().optional(),
  objective: z.string().optional(),
  experience: z.array(z.object({
    id: z.string(),
    jobTitle: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    responsibilities: z.array(z.string()).optional(),
    achievements: z.array(z.string()).optional(),
  })).optional(),
  education: z.array(z.object({
    id: z.string(),
    degree: z.string(),
    institution: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  skills: z.object({
    technical: z.array(z.object({
      id: z.string(),
      name: z.string(),
      level: z.number().min(1).max(5).optional(),
      category: z.string().optional(),
    })).optional(),
    soft: z.array(z.object({
      id: z.string(),
      name: z.string(),
      level: z.number().min(1).max(5).optional(),
    })).optional(),
  }).optional(),
  languages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    reading: z.string().optional(),
    writing: z.string().optional(),
    speaking: z.string().optional(),
    level: z.enum(['native', 'professional', 'basic']).optional(),
  })).optional(),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    githubUrl: z.string().optional(),
    liveUrl: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().optional(),
  })).optional(),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  awards: z.array(z.object({
    id: z.string(),
    title: z.string(),
    issuer: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  publications: z.array(z.object({
    id: z.string(),
    title: z.string(),
    publisher: z.string().optional(),
    date: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
  volunteer: z.array(z.object({
    id: z.string(),
    role: z.string(),
    organization: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  references: z.array(z.object({
    id: z.string(),
    name: z.string(),
    company: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  })).optional(),
  interests: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  customSections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    items: z.array(z.object({
      id: z.string(),
      content: z.string(),
    })),
  })).optional(),
  sectionOrder: z.array(z.string()).optional(),
  hiddenSections: z.array(z.string()).optional(),
});

export const resumeThemeSchema = z.object({
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  lineHeight: z.number().optional(),
  margins: z.object({
    top: z.number(),
    bottom: z.number(),
    left: z.number(),
    right: z.number(),
  }).optional(),
  spacing: z.number().optional(),
  headerStyle: z.string().optional(),
  sectionStyle: z.string().optional(),
  showPhoto: z.boolean().optional(),
  showIcons: z.boolean().optional(),
});

export const createResumeSchema = z.object({
  title: z.string().min(1).optional(),
  templateId: z.string().uuid(),
  content: resumeContentSchema.optional(),
  theme: resumeThemeSchema.optional(),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  templateId: z.string().uuid().optional(),
  content: resumeContentSchema.optional(),
  theme: resumeThemeSchema.optional(),
  status: z.nativeEnum(ResumeStatus).optional(),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeTheme = z.infer<typeof resumeThemeSchema>;
