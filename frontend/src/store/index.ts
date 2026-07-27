import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ResumeContent, ResumeTheme } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) },
  ),
);

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }
      },
    }),
    { name: 'theme-storage' },
  ),
);

interface BuilderState {
  content: ResumeContent;
  theme: ResumeTheme;
  isDirty: boolean;
  isSaving: boolean;
  undoStack: ResumeContent[];
  redoStack: ResumeContent[];
  setContent: (content: ResumeContent) => void;
  loadContent: (content: ResumeContent) => void;
  applyImportedContent: (content: ResumeContent) => void;
  updateContent: (updater: (prev: ResumeContent) => ResumeContent) => void;
  setTheme: (theme: ResumeTheme) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const defaultContent: ResumeContent = {
  personalInfo: { firstName: '', lastName: '', email: '', phone: '', jobTitle: '' },
  summary: '',
  experience: [],
  education: [],
  skills: { technical: [], soft: [] },
  languages: [],
  projects: [],
  sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects'],
  hiddenSections: [],
};

const defaultTheme: ResumeTheme = {
  primaryColor: '#6366f1',
  accentColor: '#8b5cf6',
  fontFamily: 'Inter',
  fontSize: 11,
  lineHeight: 1.5,
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
  spacing: 16,
  headerStyle: 'centered',
  sectionStyle: 'underline',
  showPhoto: true,
  showIcons: true,
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  content: defaultContent,
  theme: defaultTheme,
  isDirty: false,
  isSaving: false,
  undoStack: [],
  redoStack: [],
  setContent: (content) => set({ content, isDirty: true }),
  loadContent: (content) =>
    set({
      content: content ?? defaultContent,
      isDirty: false,
      isSaving: false,
      undoStack: [],
      redoStack: [],
    }),
  applyImportedContent: (content) =>
    set({
      content: content ?? defaultContent,
      isDirty: true,
      isSaving: false,
      undoStack: [],
      redoStack: [],
    }),
  updateContent: (updater) => {
    const prev = get().content;
    set((state) => ({
      undoStack: [...state.undoStack.slice(-19), prev],
      redoStack: [],
      content: updater(prev),
      isDirty: true,
    }));
  },
  setTheme: (theme) => set({ theme, isDirty: true }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  undo: () => {
    const { undoStack, content, redoStack } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      content: previous,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, content],
      isDirty: true,
    });
  },
  redo: () => {
    const { redoStack, content, undoStack } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      content: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, content],
      isDirty: true,
    });
  },
  reset: () => set({ content: defaultContent, theme: defaultTheme, isDirty: false, undoStack: [], redoStack: [] }),
}));
