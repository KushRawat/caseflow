import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { importStore } from '../state/import.store';
export const UploadDock = () => {
    const progress = importStore((state) => state.submitProgress);
    if (!progress || (progress.status === 'idle' && progress.processed === 0)) {
        return null;
    }
    const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
    const statusLabel = progress.status === 'uploading' ? 'Uploading' : progress.status === 'done' ? 'Finished' : 'Paused';
    return (_jsxs("div", { className: "upload-dock", "aria-live": "polite", children: [_jsxs("div", { className: "dock-copy", children: [_jsx("span", { className: "dock-label", children: statusLabel }), _jsxs("strong", { children: [progress.processed, "/", progress.total, " rows"] })] }), _jsxs("div", { className: "dock-meter", children: [_jsx("div", { className: "progress-meter mini", children: _jsx("div", { className: "progress-bar", style: { width: `${percent}%` } }) }), _jsx(Link, { to: "/import", className: "ghost-link compact", children: "View upload" })] })] }));
};
