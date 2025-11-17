import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authStore } from '../state/auth.store';
import { uiStore } from '../state/ui.store';
export const LoginPage = () => {
    const { t } = useTranslation();
    const { register, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });
    const status = authStore((state) => state.status);
    const user = authStore((state) => state.user);
    const signIn = authStore((state) => state.signIn);
    const error = authStore((state) => state.error);
    const loginLayout = uiStore((state) => state.loginLayout);
    const setLoginLayout = uiStore((state) => state.setLoginLayout);
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
    const formFields = (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "login-form-fields", children: [_jsxs("label", { className: "form-field", children: [_jsx("span", { children: t('login.email') }), _jsx("input", { type: "email", ...register('email', { required: true }), autoComplete: "email" })] }), _jsxs("label", { className: "form-field", children: [_jsx("span", { children: t('login.password') }), _jsx("input", { type: "password", ...register('password', { required: true }), autoComplete: "current-password" })] }), error && _jsx("p", { className: "error-text", children: error }), _jsx("button", { type: "submit", className: `primary ${status === 'loading' ? 'button-loading' : ''}`, disabled: status === 'loading', children: status === 'loading' ? _jsx("span", { className: "spinner", "aria-hidden": true }) : t('login.cta') })] }));
    const heroLayout = (_jsxs("div", { className: "login-hero", children: [_jsxs("div", { className: "login-copy", children: [_jsx("div", { className: "hero-logo", children: "CF" }), _jsxs("h1", { children: ["Import faster. ", _jsx("span", { children: "Trust every row." })] }), _jsx("p", { children: "CaseFlow wraps your entire intake pipeline\u2014upload, fix, and track cases with delightful speed and zero surprises." }), _jsxs("ul", { className: "login-bullets", children: [_jsx("li", { children: "Virtualized grid handles 50k+ rows effortlessly" }), _jsx("li", { children: "Chunked uploads with automatic retries and telemetry" }), _jsx("li", { children: "Auditable history for every batch and case" })] })] }), _jsxs("div", { className: "login-form-card surface-card", children: [_jsx("h2", { children: t('login.title') }), _jsx("p", { className: "text-muted", children: "Use your workspace credentials to continue." }), formFields] }), _jsx("div", { className: "floating-orb orb-1" }), _jsx("div", { className: "floating-orb orb-2" })] }));
    const classicLayout = (_jsx("div", { className: "login-classic", children: _jsxs("div", { className: "surface-card", children: [_jsx("div", { className: "hero-logo", children: "CF" }), _jsx("h2", { children: t('login.title') }), _jsx("p", { className: "text-muted", children: "Securely sign in to continue." }), formFields] }) }));
    return (_jsxs("div", { className: "login-wrapper", children: [_jsxs("div", { className: "layout-toggle", children: [_jsxs("div", { children: [_jsx("span", { children: "Login layout" }), _jsx("p", { className: "text-muted", children: "Choose the experience that fits your workflow." })] }), _jsx("div", { className: "segment-controls", children: [
                            { id: 'hero', label: 'Showcase' },
                            { id: 'classic', label: 'Compact' }
                        ].map((option) => (_jsx("button", { type: "button", className: loginLayout === option.id ? 'active' : '', onClick: () => setLoginLayout(option.id), children: option.label }, option.id))) })] }), loginLayout === 'hero' ? heroLayout : classicLayout] }));
};
