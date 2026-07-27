import api from './api';
import type { ApiResponse, Resume, ResumeContent, ResumeTheme } from '@/types';

export const resumeService = {
  getAll: (params?: { search?: string; sort?: string; status?: string }) =>
    api.get<ApiResponse<Resume[]>>('/resumes', { params }),

  getById: (id: string) => api.get<ApiResponse<Resume>>(`/resumes/${id}`),

  create: (data: { title?: string; templateId: string; content?: ResumeContent; theme?: ResumeTheme }) =>
    api.post<ApiResponse<Resume>>('/resumes', data),

  update: (id: string, data: Partial<{ title: string; content: ResumeContent; theme: ResumeTheme; templateId: string }>) =>
    api.put<ApiResponse<Resume>>(`/resumes/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/resumes/${id}`),

  duplicate: (id: string) => api.post<ApiResponse<Resume>>(`/resumes/${id}/duplicate`),

  toggleFavorite: (id: string) => api.post<ApiResponse<Resume>>(`/resumes/${id}/favorite`),

  share: (id: string) => api.post<ApiResponse<Resume>>(`/resumes/${id}/share`),

  restoreVersion: (id: string, versionId: string) =>
    api.post<ApiResponse<Resume>>(`/resumes/${id}/versions/${versionId}/restore`),

  recordDownload: (id: string, format: string) =>
    api.post(`/resumes/${id}/download`, { format }),

  import: (file: File, templateId: string, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', templateId);
    if (title) formData.append('title', title);
    return api.post<ApiResponse<Resume>>('/resumes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
