import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { importStore } from '../state/import.store';
export const ImportProgress = () => {
    const progress = importStore((state) => state.submitProgress);
    if (!progress)
        return null;
    const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
    return (_jsxs("section", { className: "surface-card", "aria-live": "polite", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Upload progress" }), _jsx("p", { className: "text-muted", children: "We batch rows in chunks of 500 and retry failed chunks automatically." })] }), _jsxs("span", { className: `badge ${progress.failure ? 'danger' : 'success'}`, children: [percent, "%"] })] }), _jsx("div", { className: "progress-meter", children: _jsx("div", { className: "progress-bar", style: { width: `${percent}%` } }) }), _jsxs("p", { children: [progress.processed, "/", progress.total, " rows processed \u00B7 Success ", progress.success, " \u00B7 Failed ", progress.failure] })] }));
};
