import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { notifySuccess } from './utils/toast';
const App = () => {
    const location = useLocation();
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
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
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
        void signOut({ silent: true }).finally(() => {
            notifySuccess('Signed out');
            navigate('/login', { replace: true });
        });
    };
    const layoutOptions = [
        { label: 'Sidebar', value: 'sidebar', hint: 'Ops workspace' },
        { label: 'Top bar', value: 'topbar', hint: 'Wide cases view' }
    ];
    const themeOptions = [
        { label: 'Light', value: 'light', icon: '🌤️' },
        { label: 'Dark', value: 'dark', icon: '🌙' }
    ];
    const quickControls = (_jsxs("div", { className: "control-chip-row", children: [_jsxs("div", { className: "control-chip", children: [_jsx("span", { children: "Dashboard layout" }), _jsx("div", { className: "chip-options", children: layoutOptions.map((option) => (_jsxs("button", { type: "button", className: `chip ${dashboardLayout === option.value ? 'active' : ''}`, onClick: () => setDashboardLayout(option.value), children: [_jsx("small", { children: option.hint }), option.label] }, option.value))) })] }), _jsxs("div", { className: "control-chip", children: [_jsx("span", { children: "Theme" }), _jsx("div", { className: "chip-options", children: themeOptions.map((option) => (_jsxs("button", { type: "button", className: `chip ${theme === option.value ? 'active' : ''}`, onClick: () => setTheme(option.value), children: [_jsx("span", { "aria-hidden": true, children: option.icon }), option.label] }, option.value))) })] })] }));
    const userInitial = user?.email?.[0]?.toUpperCase() ?? 'C';
    const userPanel = (_jsxs("div", { className: "user-panel", children: [_jsx("div", { className: "avatar-pill", "aria-hidden": true, children: userInitial }), _jsxs("div", { children: [_jsx("p", { children: user?.email }), _jsx("span", { className: "role-pill", children: roleLabel })] }), _jsx("button", { type: "button", className: "ghost", onClick: handleSignOut, children: "Sign out" })] }));
    const routes = (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(UnauthRoute, { children: _jsx(LoginPage, {}) }) }), user?.role === 'ADMIN' && (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/import", element: _jsx(ProtectedRoute, { children: _jsx(ImportPage, {}) }) }), _jsx(Route, { path: "/imports/history", element: _jsx(ProtectedRoute, { children: _jsx(ImportHistoryPage, {}) }) })] })), _jsx(Route, { path: "/cases", element: _jsx(ProtectedRoute, { children: _jsx(CasesPage, {}) }) }), _jsx(Route, { path: "/cases/:caseId", element: _jsx(ProtectedRoute, { children: _jsx(CaseDetailPage, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
    const skipLink = (_jsx("a", { className: "skip-link", href: "#main-content", children: "Skip to main content" }));
    if (!user) {
        return (_jsxs("div", { className: "app-shell auth-shell", children: [skipLink, _jsx("main", { className: "auth-main", id: "main-content", children: routes })] }));
    }
    if (dashboardLayout === 'topbar') {
        return (_jsxs("div", { className: "app-shell topbar-shell", children: [skipLink, _jsxs("header", { className: "app-header", children: [_jsxs("div", { className: "app-brand", children: [_jsx("div", { className: "logo", children: "CF" }), _jsxs("div", { children: [_jsx("strong", { children: "CaseFlow" }), _jsx("p", { className: "text-muted", children: "Ops control center" })] })] }), _jsx("nav", { className: "app-nav", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`, children: item.label }, item.to))) }), _jsxs("div", { className: "header-controls", children: [quickControls, userPanel] })] }), _jsx("main", { className: "app-main", id: "main-content", children: routes }), _jsx(UploadDock, {})] }));
    }
    return (_jsxs("div", { className: "app-shell with-sidebar", children: [skipLink, _jsxs("aside", { className: "app-sidebar", children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("div", { className: "logo", children: "CF" }), _jsxs("div", { children: [_jsx("strong", { children: "CaseFlow" }), _jsx("p", { children: "Ops Control Center" })] })] }), _jsx("nav", { className: "sidebar-nav", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`, children: item.label }, item.to))) }), _jsx("div", { className: "sidebar-section", children: quickControls }), _jsx("div", { className: "sidebar-section", children: userPanel })] }), _jsx("main", { className: "app-main", id: "main-content", children: routes }), _jsx(UploadDock, {})] }));
};
export default App;
