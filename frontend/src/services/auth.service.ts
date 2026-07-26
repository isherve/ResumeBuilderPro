import api from './api';
import type { ApiResponse, AuthResponse, User } from '@/types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getProfile: () => api.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<User>>('/auth/profile', data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),

  verifyEmail: (token: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token }),

  deleteAccount: () => api.delete<ApiResponse<{ message: string }>>('/auth/account'),

  getGoogleAuthUrl: () => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base.replace(/\/$/, '')}/auth/google`;
  },

  getGoogleStatus: () =>
    api.get<ApiResponse<{ enabled: boolean; devMode?: boolean; callbackUrl?: string }>>('/auth/google/status'),

  devGoogleLogin: () => api.post<ApiResponse<AuthResponse>>('/auth/google/dev'),
};
