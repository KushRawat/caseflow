import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toast } from 'react-hot-toast';
import { TOAST_DURATION } from '../config/ui';
const icons = {
    success: '✓',
    error: '!',
    info: 'i'
};
export const ToastMessage = ({ toastInstance, type, message, description }) => {
    return (_jsxs("div", { className: `toast-card ${type} ${toastInstance.visible ? 'enter' : 'exit'}`, role: "status", "aria-live": "assertive", tabIndex: 0, children: [_jsxs("div", { className: "toast-body", children: [_jsx("span", { className: "toast-icon", "aria-hidden": true, children: icons[type] }), _jsxs("div", { className: "toast-content", children: [_jsx("strong", { children: message }), description && _jsx("small", { children: description })] }), _jsx("button", { type: "button", className: "toast-dismiss", "aria-label": "Dismiss notification", onClick: () => toast.dismiss(toastInstance.id), children: "\u00D7" })] }), _jsx("div", { className: "toast-progress", children: _jsx("span", { style: { animationDuration: `${TOAST_DURATION}ms` } }) })] }));
};
