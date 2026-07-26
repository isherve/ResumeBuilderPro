export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  address?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  profileCompletion: number;
  settings?: UserSettings;
  createdAt: string;
  subscriptions?: Subscription[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    autosave: boolean;
    reminders: boolean;
  };
}

export interface Subscription {
  id: string;
  plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
}

export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  photo?: string;
  jobTitle?: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string[];
  achievements?: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: number;
  category?: string;
}

export interface Language {
  id: string;
  name: string;
  reading?: string;
  writing?: string;
  speaking?: string;
  level?: 'native' | 'professional' | 'basic';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies?: string[];
  githubUrl?: string;
  liveUrl?: string;
  image?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Reference {
  id: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: { id: string; content: string }[];
}

export interface ResumeContent {
  personalInfo?: PersonalInfo;
  summary?: string;
  objective?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: { technical?: Skill[]; soft?: Skill[] };
  languages?: Language[];
  projects?: Project[];
  certifications?: Certification[];
  achievements?: { id: string; title: string; description?: string; date?: string }[];
  awards?: { id: string; title: string; issuer?: string; date?: string }[];
  publications?: { id: string; title: string; publisher?: string; date?: string; url?: string }[];
  volunteer?: { id: string; role: string; organization: string; startDate?: string; endDate?: string; description?: string }[];
  references?: Reference[];
  interests?: string[];
  hobbies?: string[];
  customSections?: CustomSection[];
  sectionOrder?: string[];
  hiddenSections?: string[];
}

export interface ResumeTheme {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  margins?: { top: number; bottom: number; left: number; right: number };
  spacing?: number;
  headerStyle?: string;
  sectionStyle?: string;
  showPhoto?: boolean;
  showIcons?: boolean;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  slug: string;
  templateId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  content: ResumeContent;
  theme: ResumeTheme;
  atsScore: number;
  resumeScore: number;
  isFavorite: boolean;
  downloadCount: number;
  viewCount: number;
  shareToken?: string;
  isPublic: boolean;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
  template?: Template;
  versions?: ResumeVersion[];
}

export interface ResumeVersion {
  id: string;
  version: number;
  content: ResumeContent;
  theme: ResumeTheme;
  label?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  previewImages: string[];
  isPremium: boolean;
  isActive: boolean;
  popularity: number;
  usageCount: number;
  defaultTheme: ResumeTheme;
  layout: Record<string, unknown>;
}

export interface DashboardStats {
  totalResumes: number;
  totalDownloads: number;
  avgAtsScore: number;
  avgResumeScore: number;
  aiUsageCount: number;
  profileCompletion: number;
  plan: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentResumes: Resume[];
  recentActivity: Activity[];
  user: { name?: string; avatar?: string };
}

export interface Activity {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ATSAnalysis {
  overallScore: number;
  keywords: { found: string[]; missing: string[]; score: number };
  formatting: { score: number; issues: string[] };
  sections: { score: number; present: string[]; missing: string[] };
  length: { score: number; wordCount: number; recommendation: string };
  readability: { score: number; gradeLevel: string };
  suggestions: string[];
}

export interface JobMatch {
  matchPercentage: number;
  missingSkills: string[];
  keywordSuggestions: string[];
  matchedKeywords: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Notification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING' | 'AUTOSAVE' | 'REMINDER';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
