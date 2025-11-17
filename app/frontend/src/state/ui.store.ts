import { create } from 'zustand';

type LoginLayout = 'hero' | 'classic';
type DashboardLayout = 'sidebar' | 'topbar';
type Theme = 'light' | 'dark';

type UIState = {
  loginLayout: LoginLayout;
  dashboardLayout: DashboardLayout;
  theme: Theme;
  setLoginLayout: (layout: LoginLayout) => void;
  toggleLoginLayout: () => void;
  setDashboardLayout: (layout: DashboardLayout) => void;
  toggleDashboardLayout: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrateTheme: () => void;
};

const THEME_STORAGE_KEY = 'caseflow-theme';

export const uiStore = create<UIState>((set, get) => ({
  loginLayout: 'hero',
  dashboardLayout: 'sidebar',
  theme: 'light',
  setLoginLayout: (layout) => set({ loginLayout: layout }),
  toggleLoginLayout: () =>
    set({ loginLayout: get().loginLayout === 'hero' ? 'classic' : 'hero' }),
  setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
  toggleDashboardLayout: () =>
    set({ dashboardLayout: get().dashboardLayout === 'sidebar' ? 'topbar' : 'sidebar' }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },
  hydrateTheme: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      set({ theme: stored });
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    set({ theme: prefersDark ? 'dark' : 'light' });
  }
}));
