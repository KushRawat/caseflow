import { create } from 'zustand';
export const uiStore = create((set, get) => ({
    loginLayout: 'hero',
    dashboardLayout: 'sidebar',
    setLoginLayout: (layout) => set({ loginLayout: layout }),
    toggleLoginLayout: () => set({ loginLayout: get().loginLayout === 'hero' ? 'classic' : 'hero' }),
    setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
    toggleDashboardLayout: () => set({ dashboardLayout: get().dashboardLayout === 'sidebar' ? 'topbar' : 'sidebar' })
}));
