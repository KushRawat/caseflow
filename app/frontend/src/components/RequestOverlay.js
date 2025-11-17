import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { requestStore } from '../state/request.store';
import { importStore } from '../state/import.store';
export const RequestOverlay = () => {
    const pending = requestStore((state) => state.pending);
    const uploadActive = importStore((state) => state.submitProgress?.status === 'uploading');
    if (!pending || uploadActive)
        return null;
    return (_jsx("div", { className: "request-overlay", role: "status", "aria-live": "polite", children: _jsxs("div", { className: "overlay-card", children: [_jsx("span", { className: "spinner large", "aria-hidden": true }), _jsx("p", { children: "Working on your request\u2026" })] }) }));
};
