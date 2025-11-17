import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from 'react';
import { BackButton } from '../../components/BackButton';
import { ImportHistoryPanel } from '../../components/ImportHistoryPanel';
import { ImportReport } from '../../components/ImportReport';
export const ImportHistoryPage = () => {
    const [activeImportId, setActiveImportId] = useState(null);
    const reportAnchorRef = useRef(null);
    useEffect(() => {
        if (activeImportId && reportAnchorRef.current) {
            reportAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [activeImportId]);
    return (_jsxs("div", { className: "page-grid", children: [_jsxs("section", { className: "surface-card", children: [_jsx(BackButton, {}), _jsx("div", { className: "section-title", children: _jsxs("div", { children: [_jsx("h2", { children: "Recent import activity" }), _jsx("p", { className: "text-muted", children: "Audit past uploads, download failed rows, and jump back into any report." })] }) })] }), _jsxs("div", { className: "stack", children: [_jsx(ImportHistoryPanel, { activeImportId: activeImportId, onSelectReport: setActiveImportId }), _jsx("div", { ref: reportAnchorRef, children: activeImportId && _jsx(ImportReport, { importId: activeImportId }) })] })] }));
};
