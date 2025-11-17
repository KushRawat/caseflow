import { useCallback, useEffect } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { CaseDetailPage } from './pages/cases/CaseDetailPage';
import { CasesPage } from './pages/cases/CasesPage';
import { ImportPage } from './pages/import/ImportPage';
import { ImportHistoryPage } from './pages/import/ImportHistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { UnauthRoute } from './routes/UnauthRoute';
import { authStore } from './state/auth.store';
import { uiStore } from './state/ui.store';
import { UploadDock } from './components/UploadDock';

const App = () => {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const signOut = authStore((state) => state.signOut);
  const dashboardLayout = uiStore((state) => state.dashboardLayout);
  const setDashboardLayout = uiStore((state) => state.setDashboardLayout);
  const theme = uiStore((state) => state.theme);
  const hydrateTheme = uiStore((state) => state.hydrateTheme);
  const setTheme = uiStore((state) => state.setTheme);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  const applyTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
  }, [theme]);

  useEffect(() => {
    applyTheme();
    if (theme !== 'system' || typeof window === 'undefined') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [applyTheme, theme]);

  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : 'Operator';
  const navItems = [
    ...(user?.role === 'ADMIN'
      ? [
          { label: 'Import workspace', to: '/import' },
          { label: 'Recent imports', to: '/imports/history' }
        ]
      : []),
    { label: 'Cases', to: '/cases' }
  ];

  const handleSignOut = () => {
    void signOut().finally(() => {
      navigate('/login', { replace: true });
    });
  };

  const layoutOptions: Array<{ label: string; value: 'sidebar' | 'topbar'; hint: string }> = [
    { label: 'Sidebar', value: 'sidebar', hint: 'Ops workspace' },
    { label: 'Top bar', value: 'topbar', hint: 'Wide cases view' }
  ];

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system'; icon: string }> = [
    { label: 'Light', value: 'light', icon: '🌤️' },
    { label: 'Dark', value: 'dark', icon: '🌙' },
    { label: 'System', value: 'system', icon: '🖥️' }
  ];

  const quickControls = (
    <div className="control-chip-row compact">
      <div className="control-chip">
        <span>Layout</span>
        <div className="chip-options">
          {layoutOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${dashboardLayout === option.value ? 'active' : ''}`}
              onClick={() => setDashboardLayout(option.value)}
            >
              <span className="chip-heading">{option.label}</span>
              <small>{option.hint}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="control-chip">
        <span>Theme</span>
        <div className="chip-options">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${theme === option.value ? 'active' : ''}`}
              onClick={() => setTheme(option.value)}
            >
              <span aria-hidden>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'C';
  const userPanel = (
    <div className="user-panel">
      <div className="avatar-pill" aria-hidden>
        {userInitial}
      </div>
      <div>
        <p>{user?.email}</p>
        <span className="role-pill">{roleLabel}</span>
      </div>
      <button type="button" className="ghost" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );

  const routes = (
    <Routes>
      <Route
        path="/login"
        element={
          <UnauthRoute>
            <LoginPage />
          </UnauthRoute>
        }
      />
      {user?.role === 'ADMIN' && (
        <>
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <ImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/imports/history"
            element={
              <ProtectedRoute>
                <ImportHistoryPage />
              </ProtectedRoute>
            }
          />
        </>
      )}
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  const skipLink = (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  );

  if (!user) {
    return (
      <div className="app-shell auth-shell">
        {skipLink}
        <main className="auth-main" id="main-content">
          {routes}
        </main>
      </div>
    );
  }

  if (dashboardLayout === 'topbar') {
    return (
      <div className="app-shell topbar-shell">
        {skipLink}
        <header className="app-header">
          <div className="app-brand">
            <div className="logo">CF</div>
            <strong>CaseFlow</strong>
          </div>
          <nav className="app-nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-controls">
            {quickControls}
            {userPanel}
          </div>
        </header>
        <main className="app-main" id="main-content">
          {routes}
        </main>
        <UploadDock />
      </div>
    );
  }

  return (
    <div className="app-shell with-sidebar">
      {skipLink}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo">CF</div>
          <div>
            <strong>CaseFlow</strong>
            <p>Ops Control Center</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-section">{quickControls}</div>
        <div className="sidebar-section">{userPanel}</div>
      </aside>
      <main className="app-main" id="main-content">
        {routes}
      </main>
      <UploadDock />
    </div>
  );
};

export default App;
