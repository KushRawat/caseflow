import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { importStore } from '../state/import.store';
export const ImportProgress = ({ onRetryFailed, onCancelUpload }) => {
    const progress = importStore((state) => state.submitProgress);
    if (!progress)
        return null;
    const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
    const hasFailedChunks = progress.failedChunks.length > 0;
    const canCancel = progress.status === 'uploading' && Boolean(onCancelUpload);
    const chunkList = hasFailedChunks
        ? progress.failedChunks
            .slice(0, 5)
            .map((index) => index + 1)
            .join(', ')
        : '';
    return (_jsxs("section", { className: "surface-card upload-progress", "aria-live": "polite", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Upload progress" }), _jsx("p", { className: "text-muted", children: "We batch rows in chunks of 500 and retry failed chunks automatically." })] }), _jsxs("span", { className: `badge ${hasFailedChunks || progress.failure ? 'danger' : 'success'}`, children: [percent, "%"] })] }), _jsxs("div", { className: "upload-progress-bar", children: [_jsx("div", { className: "progress-meter", role: "progressbar", "aria-valuenow": percent, "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { className: "progress-bar", style: { width: `${percent}%` } }) }), _jsxs("span", { className: "progress-label", children: [percent, "%"] }), canCancel && (_jsx("button", { type: "button", className: "ghost", onClick: onCancelUpload, children: "Cancel upload" }))] }), _jsxs("p", { children: [progress.processed, "/", progress.total, " rows processed \u00B7 Success ", progress.success, " \u00B7 Failed ", progress.failure] }), _jsxs("p", { className: "text-muted", children: ["Created ", progress.created, " \u00B7 Updated ", progress.updated] }), progress.status === 'cancelled' && _jsx("p", { className: "text-muted", children: "Upload cancelled. Nothing new was sent after your stop." }), progress.lastError && (_jsxs("div", { className: "alert warning", children: [_jsx("strong", { children: "Latest error:" }), " ", progress.lastError] })), hasFailedChunks && (_jsxs("div", { className: "alert danger", children: [_jsxs("p", { children: [progress.failedChunks.length, " chunk(s) still need attention.", chunkList && _jsxs("span", { children: [" Affected indexes: ", chunkList, progress.failedChunks.length > 5 ? '…' : '', "."] }), "You can retry them without re-uploading the entire file."] }), _jsx("button", { type: "button", className: "ghost", onClick: onRetryFailed, children: "Retry failed chunks" })] }))] }));
};
