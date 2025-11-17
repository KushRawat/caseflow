import { create } from 'zustand';
const THEME_STORAGE_KEY = 'caseflow-theme';
export const uiStore = create((set, get) => ({
    loginLayout: 'hero',
    dashboardLayout: 'sidebar',
    theme: 'system',
    setLoginLayout: (layout) => set({ loginLayout: layout }),
    toggleLoginLayout: () => set({ loginLayout: get().loginLayout === 'hero' ? 'classic' : 'hero' }),
    setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
    toggleDashboardLayout: () => set({ dashboardLayout: get().dashboardLayout === 'sidebar' ? 'topbar' : 'sidebar' }),
    setTheme: (theme) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
        set({ theme });
    },
    toggleTheme: () => {
        const current = get().theme;
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        get().setTheme(next);
    },
    hydrateTheme: () => {
        if (typeof window === 'undefined')
            return;
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            set({ theme: stored });
            return;
        }
        localStorage.setItem(THEME_STORAGE_KEY, 'system');
        set({ theme: 'system' });
    }
}));
