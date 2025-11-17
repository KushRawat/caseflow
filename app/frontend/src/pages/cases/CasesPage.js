import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCases } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';
const statusOptions = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
const categoryOptions = ['TAX', 'LICENSE', 'PERMIT'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const CasesPage = () => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
        assigneeId: '',
        from: '',
        to: '',
        search: ''
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pageSize, setPageSize] = useState(5);
    const [pagination, setPagination] = useState({ history: [null], index: 0 });
    const currentCursor = pagination.history[pagination.index];
    const resetPagination = () => {
        setPagination({ history: [null], index: 0 });
    };
    const query = useQuery({
        queryKey: ['cases', filters, sortBy, sortOrder, pageSize, currentCursor],
        queryFn: () => fetchCases({
            ...filters,
            limit: pageSize,
            cursor: currentCursor ?? undefined,
            sortBy,
            sortOrder
        })
    });
    const assigneesQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
    const cases = useMemo(() => query.data?.cases ?? [], [query.data]);
    const totalRecords = query.data?.total ?? 0;
    const totalPages = query.data && query.data.pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / query.data.pageSize)) : 1;
    const canGoNext = Boolean(query.data?.nextCursor);
    const canGoBack = pagination.index > 0;
    const currentPage = pagination.index + 1;
    const getStatusLabel = (value) => t(`cases.status.${value}`, { defaultValue: value });
    const getCategoryLabel = (value) => t(`cases.categories.${value}`, { defaultValue: value });
    const getPriorityLabel = (value) => t(`cases.priorities.${value}`, { defaultValue: value });
    const updateFilters = (partial) => {
        setFilters((prev) => ({ ...prev, ...partial }));
        resetPagination();
    };
    const refresh = () => {
        void query.refetch();
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortBy(field);
            setSortOrder('desc');
        }
        resetPagination();
    };
    const goNext = () => {
        if (!query.data?.nextCursor || query.isFetching)
            return;
        setPagination((prev) => {
            const nextHistory = [...prev.history.slice(0, prev.index + 1), query.data.nextCursor];
            return { history: nextHistory, index: nextHistory.length - 1 };
        });
    };
    const goPrev = () => {
        setPagination((prev) => {
            if (prev.index === 0 || query.isFetching) {
                return prev;
            }
            return { ...prev, index: prev.index - 1 };
        });
    };
    return (_jsxs("div", { className: "surface-card", children: [_jsxs("div", { className: "toolbar", children: [_jsx(BackButton, {}), _jsx("button", { type: "button", className: "ghost", onClick: refresh, disabled: query.isFetching, children: query.isFetching ? _jsx("span", { className: "spinner", "aria-hidden": true }) : t('cases.refresh', { defaultValue: 'Refresh' }) })] }), _jsx("h1", { children: t('cases.title', { defaultValue: 'Cases' }) }), _jsxs("form", { className: "filters", onSubmit: (event) => event.preventDefault(), children: [_jsx("input", { placeholder: t('cases.searchPlaceholder', { defaultValue: 'Search case ID or applicant' }), value: filters.search, onChange: (event) => updateFilters({ search: event.target.value }) }), _jsxs("select", { value: filters.status, onChange: (event) => updateFilters({ status: event.target.value }), children: [_jsx("option", { value: "", children: t('cases.filters.status', { defaultValue: 'Status' }) }), statusOptions.map((option) => (_jsx("option", { value: option, children: getStatusLabel(option) }, option)))] }), _jsxs("select", { value: filters.category, onChange: (event) => updateFilters({ category: event.target.value }), children: [_jsx("option", { value: "", children: t('cases.filters.category', { defaultValue: 'Category' }) }), categoryOptions.map((option) => (_jsx("option", { value: option, children: getCategoryLabel(option) }, option)))] }), _jsxs("select", { value: filters.priority, onChange: (event) => updateFilters({ priority: event.target.value }), children: [_jsx("option", { value: "", children: t('cases.filters.priority', { defaultValue: 'Priority' }) }), priorityOptions.map((option) => (_jsx("option", { value: option, children: getPriorityLabel(option) }, option)))] }), _jsxs("select", { value: filters.assigneeId, onChange: (event) => updateFilters({ assigneeId: event.target.value }), children: [_jsx("option", { value: "", children: t('cases.filters.assignee', { defaultValue: 'Assignee' }) }), (assigneesQuery.data?.users ?? []).map((user) => (_jsx("option", { value: user.id, children: user.email }, user.id)))] }), _jsx("input", { type: "date", value: filters.from, onChange: (event) => updateFilters({ from: event.target.value }), "aria-label": "From date" }), _jsx("input", { type: "date", value: filters.to, onChange: (event) => updateFilters({ to: event.target.value }), "aria-label": "To date" }), _jsx("button", { type: "button", className: "ghost", onClick: () => {
                            setFilters({
                                status: '',
                                category: '',
                                priority: '',
                                assigneeId: '',
                                from: '',
                                to: '',
                                search: ''
                            });
                            resetPagination();
                        }, children: t('cases.clearFilters', { defaultValue: 'Clear filters' }) })] }), _jsx("div", { className: "page-size-control", children: _jsxs("label", { children: [t('cases.rowsPerPage', { defaultValue: 'Rows per page' }), _jsx("select", { value: pageSize, onChange: (event) => {
                                setPageSize(Number(event.target.value));
                                resetPagination();
                            }, children: PAGE_SIZE_OPTIONS.map((size) => (_jsx("option", { value: size, children: size }, size))) })] }) }), _jsx("div", { className: "grid-scroll cases-table-wrapper", children: _jsxs("table", { className: "table cases-table", children: [_jsx("thead", { children: _jsx("tr", { children: columnDefs.map((col) => (_jsxs("th", { onClick: col.sortable ? () => handleSort(col.sortKey) : undefined, style: { cursor: col.sortable ? 'pointer' : 'default' }, children: [t(`cases.table.${col.i18nKey}`, { defaultValue: col.label }), col.sortable && sortBy === col.sortKey ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''] }, col.label))) }) }), _jsx("tbody", { children: cases.map((caseItem) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx(Link, { to: `/cases/${caseItem.id}`, children: caseItem.caseId }) }), _jsx("td", { children: caseItem.applicantName }), _jsx("td", { children: getStatusLabel(caseItem.status) }), _jsx("td", { children: getCategoryLabel(caseItem.category) }), _jsx("td", { children: getPriorityLabel(caseItem.priority) }), _jsx("td", { children: new Date(caseItem.updatedAt).toLocaleDateString() })] }, caseItem.id))) })] }) }), _jsx("p", { className: "text-muted", style: { marginTop: '0.35rem' }, children: t('cases.summary', {
                    count: pageSize,
                    total: totalRecords,
                    defaultValue: `Showing up to ${pageSize} cases per page · Total ${totalRecords} records.`
                }) }), _jsxs("div", { className: "pagination-controls", children: [_jsx("button", { type: "button", className: "ghost", onClick: goPrev, disabled: !canGoBack || query.isFetching, children: t('cases.pagination.previous', { defaultValue: 'Previous' }) }), _jsx("span", { children: t('cases.pagination.page', {
                            current: currentPage,
                            total: totalPages,
                            defaultValue: `Page ${currentPage} of ${totalPages}`
                        }) }), _jsx("button", { type: "button", className: "ghost", onClick: goNext, disabled: !canGoNext || query.isFetching, children: t('cases.pagination.next', { defaultValue: 'Next' }) })] })] }));
};
const columnDefs = [
    { label: 'Case ID', key: 'caseId', sortable: true, sortKey: 'caseId', i18nKey: 'caseId' },
    { label: 'Applicant', key: 'applicantName', i18nKey: 'applicant' },
    { label: 'Status', key: 'status', sortable: true, sortKey: 'status', i18nKey: 'status' },
    { label: 'Category', key: 'category', i18nKey: 'category' },
    { label: 'Priority', key: 'priority', sortable: true, sortKey: 'priority', i18nKey: 'priority' },
    { label: 'Updated', key: 'updatedAt', sortable: true, sortKey: 'createdAt', i18nKey: 'updated' }
];
