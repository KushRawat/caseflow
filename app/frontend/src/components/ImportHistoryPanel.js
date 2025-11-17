import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadImportErrorsCsv, listImports } from '../api/imports';
export const ImportHistoryPanel = ({ onSelectReport, activeImportId }) => {
    const { t } = useTranslation();
    const [downloadingId, setDownloadingId] = useState(null);
    const [pageSize, setPageSize] = useState(5);
    const [pagination, setPagination] = useState({ history: [null], index: 0 });
    const currentCursor = pagination.history[pagination.index];
    const historyQuery = useQuery({
        queryKey: ['imports-history', pageSize, currentCursor],
        queryFn: () => listImports({ cursor: currentCursor ?? undefined, limit: pageSize })
    });
    const imports = useMemo(() => {
        return historyQuery.data?.imports ?? [];
    }, [historyQuery.data]);
    const canGoNext = Boolean(historyQuery.data?.nextCursor);
    const canGoBack = pagination.index > 0;
    const currentPage = pagination.index + 1;
    const totalRecords = historyQuery.data?.total ?? 0;
    const totalPages = historyQuery.data && historyQuery.data.pageSize > 0
        ? Math.max(1, Math.ceil(totalRecords / historyQuery.data.pageSize))
        : 1;
    const isInitialLoading = historyQuery.isLoading && !historyQuery.data;
    const resetPagination = () => {
        setPagination({ history: [null], index: 0 });
    };
    const goNext = () => {
        if (!historyQuery.data?.nextCursor || historyQuery.isFetching)
            return;
        setPagination((prev) => {
            const history = [...prev.history.slice(0, prev.index + 1), historyQuery.data.nextCursor];
            return { history, index: history.length - 1 };
        });
    };
    const goPrev = () => {
        setPagination((prev) => {
            if (prev.index === 0 || historyQuery.isFetching)
                return prev;
            return { ...prev, index: prev.index - 1 };
        });
    };
    const handleDownloadErrors = async (importId) => {
        setDownloadingId(importId);
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
            setDownloadingId(null);
        }
    };
    return (_jsxs("section", { className: "surface-card", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: t('import.historyHeading', { defaultValue: 'Recent imports' }) }), _jsx("p", { className: "text-muted", children: t('import.historySubheading', { defaultValue: 'Track previous uploads and audit events.' }) })] }), _jsx("button", { type: "button", className: "ghost", onClick: () => historyQuery.refetch(), disabled: historyQuery.isFetching, children: historyQuery.isFetching ? _jsx("span", { className: "spinner", "aria-hidden": true }) : 'Refresh' })] }), _jsx("div", { className: "page-size-control", children: _jsxs("label", { children: ["Rows per page", _jsx("select", { value: pageSize, onChange: (event) => {
                                setPageSize(Number(event.target.value));
                                resetPagination();
                            }, children: [5, 10, 20, 50].map((size) => (_jsx("option", { value: size, children: size }, size))) })] }) }), isInitialLoading ? (_jsx("p", { className: "text-muted", children: "Loading history\u2026" })) : historyQuery.isError ? (_jsx("p", { className: "text-muted", children: "We couldn't load import history right now. Please retry in a moment." })) : imports.length === 0 ? (_jsx("p", { className: "text-muted", children: historyQuery.isFetching ? 'Loading history…' : 'No imports yet — upload a CSV to generate history.' })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid-scroll", style: { maxHeight: 320 }, children: _jsxs("table", { className: "table compact", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Source" }), _jsx("th", { children: "Actor" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Rows" }), _jsx("th", { children: "Created" }), _jsx("th", { "aria-label": "Actions" })] }) }), _jsx("tbody", { children: imports.map((job) => (_jsxs("tr", { className: activeImportId === job.id ? 'active-row' : '', children: [_jsx("td", { children: job.id.slice(0, 6) }), _jsx("td", { children: job.sourceName ?? 'CSV upload' }), _jsx("td", { children: job.createdBy?.email ?? 'Unknown' }), _jsx("td", { children: _jsx("span", { className: `badge ${job.status === 'FAILED' ? 'danger' : job.status === 'COMPLETED' ? 'success' : 'secondary'}`, children: job.status }) }), _jsxs("td", { children: [job.successCount, "/", job.totalRows] }), _jsx("td", { children: new Date(job.createdAt).toLocaleString() }), _jsx("td", { children: _jsxs("div", { className: "history-actions", children: [_jsx("button", { type: "button", className: "ghost", onClick: () => onSelectReport(job.id), children: t('import.viewReport', { defaultValue: 'View report' }) }), _jsx("button", { type: "button", className: "ghost", onClick: () => void handleDownloadErrors(job.id), disabled: downloadingId === job.id, children: downloadingId === job.id ? _jsx("span", { className: "spinner", "aria-hidden": true }) : t('import.downloadCsv', { defaultValue: 'Download CSV' }) })] }) })] }, job.id))) })] }) }), _jsxs("p", { className: "text-muted", style: { marginTop: '0.35rem' }, children: ["Showing up to ", pageSize, " imports per page \u00B7 Total ", totalRecords, " records."] })] })), _jsxs("div", { className: "pagination-controls", children: [_jsx("button", { type: "button", className: "ghost", onClick: goPrev, disabled: !canGoBack || historyQuery.isFetching, children: "Previous" }), _jsxs("span", { children: ["Page ", currentPage, " ", totalPages > 1 ? `of ${totalPages}` : ''] }), _jsx("button", { type: "button", className: "ghost", onClick: goNext, disabled: !canGoNext || historyQuery.isFetching, children: "Next" })] })] }));
};
