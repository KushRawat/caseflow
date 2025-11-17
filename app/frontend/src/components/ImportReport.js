import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadImportErrorsCsv, fetchImport } from '../api/imports';
const formatAuditMessage = (audit) => {
    const metadata = (audit.metadata ?? {});
    switch (audit.action) {
        case 'IMPORT_CREATED':
            return `Import created – ${metadata.totalRows ?? 'unknown'} rows from ${metadata.sourceName ?? 'CSV'}`;
        case 'CHUNK_PROCESSED': {
            const index = typeof metadata.chunkIndex === 'number' ? metadata.chunkIndex : Number(metadata.chunkIndex ?? 0);
            return `Chunk #${Number.isNaN(index) ? '?' : index + 1} processed (${metadata.success ?? 0} success / ${metadata.failure ?? 0} failed)`;
        }
        case 'IMPORT_COMPLETED':
            return `Import completed (${metadata.successCount ?? 0} success / ${metadata.failureCount ?? 0} failed)`;
        default:
            return audit.action;
    }
};
export const ImportReport = ({ importId }) => {
    const { t } = useTranslation();
    const [downloading, setDownloading] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['import-report', importId],
        queryFn: () => fetchImport(importId),
        enabled: Boolean(importId),
        refetchInterval: 15000
    });
    const topErrors = useMemo(() => (data?.errors ?? []).slice(0, 5), [data?.errors]);
    const topAudits = useMemo(() => (data?.audits ?? []).slice(0, 5), [data?.audits]);
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const blob = await downloadImportErrorsCsv(importId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `import-${importId}-errors.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        finally {
            setDownloading(false);
        }
    };
    if (isLoading) {
        return (_jsxs("section", { className: "surface-card", children: [_jsx("h2", { children: t('import.reportHeading', { defaultValue: 'Import report' }) }), _jsx("p", { children: "Loading latest stats\u2026" })] }));
    }
    if (!data)
        return null;
    return (_jsxs("section", { className: "surface-card", "aria-live": "polite", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: t('import.reportHeading', { defaultValue: 'Import report' }) }), _jsx("p", { className: "text-muted", children: t('import.reportSubheading', { defaultValue: 'Track successes, failures, and export validation errors.' }) })] }), _jsx("span", { className: `badge ${data.failureCount ? 'danger' : 'success'}`, children: data.status })] }), _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total rows" }), _jsx("strong", { children: data.totalRows })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Successful" }), _jsx("strong", { children: data.successCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Failed" }), _jsx("strong", { children: data.failureCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Completed at" }), _jsx("strong", { children: data.completedAt ? new Date(data.completedAt).toLocaleString() : 'Processing' })] })] }), _jsxs("div", { className: "toolbar", children: [_jsxs("div", { children: [_jsx("h3", { children: "Error sample" }), _jsx("p", { className: "text-muted", children: "Showing up to five recent issues." })] }), _jsx("button", { type: "button", className: "ghost", onClick: handleDownload, disabled: downloading, children: downloading ? _jsx("span", { className: "spinner", "aria-hidden": true }) : t('import.downloadCsv', { defaultValue: 'Download CSV' }) })] }), topErrors.length === 0 ? (_jsx("p", { children: t('import.noErrors', { defaultValue: 'No errors recorded for this import 🎉' }) })) : (_jsxs("table", { className: "table compact", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Row" }), _jsx("th", { children: "Field" }), _jsx("th", { children: "Message" })] }) }), _jsx("tbody", { children: topErrors.map((error) => (_jsxs("tr", { children: [_jsx("td", { children: error.rowNumber }), _jsx("td", { children: error.field }), _jsx("td", { children: error.message })] }, error.id))) })] })), _jsx("div", { className: "toolbar", children: _jsxs("div", { children: [_jsx("h3", { children: t('import.auditHeading', { defaultValue: 'Audit trail' }) }), _jsx("p", { className: "text-muted", children: t('import.auditSubheading', { defaultValue: 'Latest events for this batch.' }) })] }) }), topAudits.length === 0 ? (_jsx("p", { className: "text-muted", children: t('import.noAudits', { defaultValue: 'No audit events yet — start an upload to log activity.' }) })) : (_jsx("ul", { className: "audit-list", children: topAudits.map((audit) => (_jsxs("li", { children: [_jsx("strong", { children: new Date(audit.createdAt).toLocaleString() }), " \u2014 ", formatAuditMessage(audit)] }, audit.id))) }))] }));
};
