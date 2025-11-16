import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { authStore } from '../state/auth.store';
import { uiStore } from '../state/ui.store';
export const LoginPage = () => {
    const { register, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });
    const status = authStore((state) => state.status);
    const user = authStore((state) => state.user);
    const signIn = authStore((state) => state.signIn);
    const error = authStore((state) => state.error);
    const loginLayout = uiStore((state) => state.loginLayout);
    const toggleLoginLayout = uiStore((state) => state.toggleLoginLayout);
    if (user && status === 'authenticated') {
        return _jsx(Navigate, { to: "/import", replace: true });
    }
    const onSubmit = async (form) => {
        try {
            await signIn(form);
        }
        catch {
            // state already updated
        }
    };
    const formFields = (_jsxs("form", { onSubmit: handleSubmit(onSubmit), children: [_jsxs("label", { children: ["Email", _jsx("input", { type: "email", ...register('email', { required: true }), autoComplete: "email" })] }), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", ...register('password', { required: true }), autoComplete: "current-password" })] }), error && _jsx("p", { className: "error-text", children: error }), _jsx("button", { type: "submit", className: `primary ${status === 'loading' ? 'button-loading' : ''}`, disabled: status === 'loading', children: status === 'loading' ? _jsx("span", { className: "spinner", "aria-hidden": true }) : 'Sign in' })] }));
    const heroLayout = (_jsxs("div", { className: "login-hero", children: [_jsxs("div", { className: "login-copy", children: [_jsx("div", { className: "hero-logo", children: "CF" }), _jsxs("h1", { children: ["Import faster. ", _jsx("span", { children: "Trust every row." })] }), _jsx("p", { children: "CaseFlow wraps your entire intake pipeline\u2014upload, fix, and track cases with delightful speed and zero surprises." }), _jsxs("ul", { className: "login-bullets", children: [_jsx("li", { children: "Virtualized grid handles 50k+ rows effortlessly" }), _jsx("li", { children: "Chunked uploads with automatic retries and telemetry" }), _jsx("li", { children: "Auditable history for every batch and case" })] })] }), _jsxs("div", { className: "login-form-card surface-card", children: [_jsx("h2", { children: "Sign in" }), _jsx("p", { className: "text-muted", children: "Use your workspace credentials to continue." }), formFields] }), _jsx("div", { className: "floating-orb orb-1" }), _jsx("div", { className: "floating-orb orb-2" })] }));
    const classicLayout = (_jsx("div", { className: "login-classic", children: _jsxs("div", { className: "surface-card", children: [_jsx("div", { className: "hero-logo", children: "CF" }), _jsx("h2", { children: "Welcome back" }), _jsx("p", { className: "text-muted", children: "Securely sign in to continue." }), formFields] }) }));
    return (_jsxs("div", { className: "login-wrapper", children: [_jsxs("div", { className: "layout-toggle", children: [_jsx("span", { children: "Login layout" }), _jsxs("button", { type: "button", className: "ghost", onClick: toggleLoginLayout, children: ["Switch to ", loginLayout === 'hero' ? 'classic' : 'hero'] })] }), loginLayout === 'hero' ? heroLayout : classicLayout] }));
};
