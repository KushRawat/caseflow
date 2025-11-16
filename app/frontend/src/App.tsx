import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { CaseDetailPage } from './pages/cases/CaseDetailPage';
import { CasesPage } from './pages/cases/CasesPage';
import { ImportPage } from './pages/import/ImportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { UnauthRoute } from './routes/UnauthRoute';
import { authStore } from './state/auth.store';
import { uiStore } from './state/ui.store';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const signOut = authStore((state) => state.signOut);
  const dashboardLayout = uiStore((state) => state.dashboardLayout);
  const toggleDashboardLayout = uiStore((state) => state.toggleDashboardLayout);

  const navItems = [
    { label: 'Import', to: '/import' },
    { label: 'Cases', to: '/cases' }
  ];

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
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        }
      />
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

  if (!user) {
    return (
      <div className="app-shell auth-shell">
        <main className="auth-main">{routes}</main>
      </div>
    );
  }

  if (dashboardLayout === 'topbar') {
    return (
      <div className="app-shell topbar-shell">
        <header className="app-header">
          <div className="app-brand">
            <div className="logo">CF</div>
            <div>
              <strong>CaseFlow</strong>
              <p className="text-muted">Ops control center</p>
            </div>
          </div>
          <div className="app-nav">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-pill ${location.pathname.startsWith(item.to) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="user-chip">
              <span>{user.email}</span>
              <div className="layout-switch">
                <small>Layout</small>
                <button type="button" className="ghost" onClick={toggleDashboardLayout}>
                  Switch to sidebar
                </button>
              </div>
              <button
                className="ghost"
                onClick={() => {
                  void signOut().finally(() => navigate('/login', { replace: true }));
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">{routes}</main>
      </div>
    );
  }

  return (
    <div className="app-shell with-sidebar">
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
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${location.pathname.startsWith(item.to) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="layout-switch">
            <small>Layout</small>
            <button type="button" className="ghost" onClick={toggleDashboardLayout}>
              Switch to top bar
            </button>
          </div>
          <p>{user.email}</p>
          <button
            className="ghost"
            onClick={() => {
              void signOut().finally(() => navigate('/login', { replace: true }));
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">{routes}</main>
    </div>
  );
};

export default App;
