import api from './api';
import type { ApiResponse, Template, ATSAnalysis, JobMatch } from '@/types';

export const templateService = {
  getAll: (params?: { category?: string; search?: string; premium?: boolean; sort?: string }) =>
    api.get<ApiResponse<Template[]>>('/templates', { params }),

  getCategories: () =>
    api.get<ApiResponse<{ name: string; count: number }[]>>('/templates/categories'),

  getBySlug: (slug: string) => api.get<ApiResponse<Template>>(`/templates/${slug}`),

  toggleFavorite: (id: string) =>
    api.post<ApiResponse<{ favorited: boolean }>>(`/templates/${id}/favorite`),
};

export const aiService = {
  generateSummary: (data: { jobTitle: string; experience: string; skills: string[] }) =>
    api.post<ApiResponse<{ summary: string }>>('/ai/summary', data),

  improveBullet: (bullet: string, jobTitle?: string) =>
    api.post<ApiResponse<{ bullet: string }>>('/ai/improve-bullet', { bullet, jobTitle }),

  rewriteBullets: (bullets: string[], jobTitle?: string) =>
    api.post<ApiResponse<{ bullets: string[] }>>('/ai/rewrite-bullets', { bullets, jobTitle }),

  suggestSkills: (jobTitle: string, existingSkills: string[]) =>
    api.post<ApiResponse<{ technical: string[]; soft: string[] }>>('/ai/suggest-skills', {
      jobTitle,
      existingSkills,
    }),

  generateCoverLetter: (data: { resumeContent: string; jobDescription: string; companyName: string }) =>
    api.post<ApiResponse<{ coverLetter: string }>>('/ai/cover-letter', data),

  grammarCorrection: (text: string) =>
    api.post<ApiResponse<{ corrected: string }>>('/ai/grammar', { text }),

  reviewResume: (resumeContent: string) =>
    api.post<ApiResponse<{ score: number; strengths: string[]; improvements: string[]; suggestions: string[] }>>(
      '/ai/review',
      { resumeContent },
    ),

  analyzeATS: (resumeId: string) =>
    api.post<ApiResponse<ATSAnalysis>>(`/ai/ats/${resumeId}`),

  matchJob: (resumeId: string, jobDescription: string) =>
    api.post<ApiResponse<JobMatch>>(`/ai/job-match/${resumeId}`, { jobDescription }),
};

export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
  getNotifications: () => api.get('/dashboard/notifications'),
  markNotificationRead: (id: string) => api.patch(`/dashboard/notifications/${id}/read`),
};

export const uploadService = {
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/resume-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
