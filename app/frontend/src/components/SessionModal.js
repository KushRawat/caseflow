import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SessionModal = ({ open, countdown, onRefresh, onSignOut }) => {
    if (!open || countdown === null)
        return null;
    return (_jsx("div", { className: "session-modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "session-title", children: _jsxs("div", { className: "session-modal", children: [_jsx("h2", { id: "session-title", children: "Session expiring soon" }), _jsxs("p", { children: ["We'll sign you out in ", _jsx("strong", { children: countdown }), " second", countdown === 1 ? '' : 's', "."] }), _jsxs("div", { className: "session-actions", children: [_jsx("button", { type: "button", className: "ghost", onClick: onSignOut, children: "Sign out" }), _jsx("button", { type: "button", className: "primary", onClick: onRefresh, children: "Stay signed in" })] })] }) }));
};
