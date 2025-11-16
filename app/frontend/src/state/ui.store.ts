import { create } from 'zustand';

type LoginLayout = 'hero' | 'classic';
type DashboardLayout = 'sidebar' | 'topbar';

type UIState = {
  loginLayout: LoginLayout;
  dashboardLayout: DashboardLayout;
  setLoginLayout: (layout: LoginLayout) => void;
  toggleLoginLayout: () => void;
  setDashboardLayout: (layout: DashboardLayout) => void;
  toggleDashboardLayout: () => void;
};

export const uiStore = create<UIState>((set, get) => ({
  loginLayout: 'hero',
  dashboardLayout: 'sidebar',
  setLoginLayout: (layout) => set({ loginLayout: layout }),
  toggleLoginLayout: () =>
    set({ loginLayout: get().loginLayout === 'hero' ? 'classic' : 'hero' }),
  setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
  toggleDashboardLayout: () =>
    set({ dashboardLayout: get().dashboardLayout === 'sidebar' ? 'topbar' : 'sidebar' })
}));
