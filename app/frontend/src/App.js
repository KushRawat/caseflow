import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const routes = (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(UnauthRoute, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/import", element: _jsx(ProtectedRoute, { children: _jsx(ImportPage, {}) }) }), _jsx(Route, { path: "/cases", element: _jsx(ProtectedRoute, { children: _jsx(CasesPage, {}) }) }), _jsx(Route, { path: "/cases/:caseId", element: _jsx(ProtectedRoute, { children: _jsx(CaseDetailPage, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
    if (!user) {
        return (_jsx("div", { className: "app-shell auth-shell", children: _jsx("main", { className: "auth-main", children: routes }) }));
    }
    if (dashboardLayout === 'topbar') {
        return (_jsxs("div", { className: "app-shell topbar-shell", children: [_jsxs("header", { className: "app-header", children: [_jsxs("div", { className: "app-brand", children: [_jsx("div", { className: "logo", children: "CF" }), _jsxs("div", { children: [_jsx("strong", { children: "CaseFlow" }), _jsx("p", { className: "text-muted", children: "Ops control center" })] })] }), _jsxs("div", { className: "app-nav", children: [navItems.map((item) => (_jsx(Link, { to: item.to, className: `nav-pill ${location.pathname.startsWith(item.to) ? 'active' : ''}`, children: item.label }, item.to))), _jsxs("div", { className: "user-chip", children: [_jsx("span", { children: user.email }), _jsxs("div", { className: "layout-switch", children: [_jsx("small", { children: "Layout" }), _jsx("button", { type: "button", className: "ghost", onClick: toggleDashboardLayout, children: "Switch to sidebar" })] }), _jsx("button", { className: "ghost", onClick: () => {
                                                void signOut().finally(() => navigate('/login', { replace: true }));
                                            }, children: "Sign out" })] })] })] }), _jsx("main", { className: "app-main", children: routes })] }));
    }
    return (_jsxs("div", { className: "app-shell with-sidebar", children: [_jsxs("aside", { className: "app-sidebar", children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("div", { className: "logo", children: "CF" }), _jsxs("div", { children: [_jsx("strong", { children: "CaseFlow" }), _jsx("p", { children: "Ops Control Center" })] })] }), _jsx("nav", { className: "sidebar-nav", children: navItems.map((item) => (_jsx(Link, { to: item.to, className: `sidebar-link ${location.pathname.startsWith(item.to) ? 'active' : ''}`, children: item.label }, item.to))) }), _jsxs("div", { className: "sidebar-footer", children: [_jsxs("div", { className: "layout-switch", children: [_jsx("small", { children: "Layout" }), _jsx("button", { type: "button", className: "ghost", onClick: toggleDashboardLayout, children: "Switch to top bar" })] }), _jsx("p", { children: user.email }), _jsx("button", { className: "ghost", onClick: () => {
                                    void signOut().finally(() => navigate('/login', { replace: true }));
                                }, children: "Sign out" })] })] }), _jsx("main", { className: "app-main", children: routes })] }));
};
export default App;
