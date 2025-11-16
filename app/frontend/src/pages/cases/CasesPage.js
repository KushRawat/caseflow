import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCases } from '../../api/cases';
import { BackButton } from '../../components/BackButton';
const statusOptions = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
const categoryOptions = ['TAX', 'LICENSE', 'PERMIT'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const PAGE_SIZE = 20;
export const CasesPage = () => {
    const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [cursor, setCursor] = useState(undefined);
    const [history, setHistory] = useState([]);
    const query = useQuery({
        queryKey: ['cases', filters, sortBy, sortOrder, cursor],
        queryFn: () => fetchCases({ ...filters, cursor, limit: PAGE_SIZE, sortBy, sortOrder }),
        placeholderData: (prev) => prev
    });
    const cases = useMemo(() => query.data?.cases ?? [], [query.data]);
    const nextCursor = query.data?.nextCursor ?? null;
    const canGoBack = history.length > 0;
    const currentPage = history.length + 1;
    const refresh = () => {
        setCursor(undefined);
        setHistory([]);
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
    };
    const goNext = () => {
        if (nextCursor) {
            setHistory((prev) => [...prev, cursor ?? '']);
            setCursor(nextCursor);
        }
    };
    const goPrev = () => {
        setHistory((prev) => {
            const stack = [...prev];
            const last = stack.pop();
            setCursor(last && last.length > 0 ? last : undefined);
            return stack;
        });
    };
    return (_jsxs("div", { className: "surface-card", children: [_jsxs("div", { className: "toolbar", children: [_jsx(BackButton, {}), _jsx("button", { type: "button", className: "ghost", onClick: refresh, disabled: query.isFetching, children: query.isFetching ? _jsx("span", { className: "spinner", "aria-hidden": true }) : 'Refresh' })] }), _jsx("h1", { children: "Cases" }), _jsxs("form", { className: "filters", onSubmit: (event) => event.preventDefault(), children: [_jsx("input", { placeholder: "Search case ID or applicant", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })) }), _jsxs("select", { value: filters.status, onChange: (event) => setFilters((prev) => ({ ...prev, status: event.target.value })), children: [_jsx("option", { value: "", children: "Status" }), statusOptions.map((option) => (_jsx("option", { children: option }, option)))] }), _jsxs("select", { value: filters.category, onChange: (event) => setFilters((prev) => ({ ...prev, category: event.target.value })), children: [_jsx("option", { value: "", children: "Category" }), categoryOptions.map((option) => (_jsx("option", { children: option }, option)))] }), _jsxs("select", { value: filters.priority, onChange: (event) => setFilters((prev) => ({ ...prev, priority: event.target.value })), children: [_jsx("option", { value: "", children: "Priority" }), priorityOptions.map((option) => (_jsx("option", { children: option }, option)))] })] }), _jsx("div", { className: "grid-scroll", style: { height: 440 }, children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsx("tr", { children: columnDefs.map((col) => (_jsxs("th", { onClick: col.sortable ? () => handleSort(col.sortKey) : undefined, style: { cursor: col.sortable ? 'pointer' : 'default' }, children: [col.label, col.sortable && sortBy === col.sortKey ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''] }, col.label))) }) }), _jsx("tbody", { children: cases.map((caseItem) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx(Link, { to: `/cases/${caseItem.id}`, children: caseItem.caseId }) }), _jsx("td", { children: caseItem.applicantName }), _jsx("td", { children: caseItem.status }), _jsx("td", { children: caseItem.category }), _jsx("td", { children: caseItem.priority }), _jsx("td", { children: new Date(caseItem.updatedAt).toLocaleDateString() })] }, caseItem.id))) })] }) }), _jsxs("div", { className: "pagination-controls", children: [_jsx("button", { type: "button", className: "ghost", onClick: goPrev, disabled: !canGoBack || query.isFetching, children: "Previous" }), _jsxs("span", { children: ["Page ", currentPage] }), _jsx("button", { type: "button", className: "ghost", onClick: goNext, disabled: !nextCursor || query.isFetching, children: "Next" })] })] }));
};
const columnDefs = [
    { label: 'Case ID', key: 'caseId', sortable: true, sortKey: 'caseId' },
    { label: 'Applicant', key: 'applicantName' },
    { label: 'Status', key: 'status', sortable: true, sortKey: 'status' },
    { label: 'Category', key: 'category' },
    { label: 'Priority', key: 'priority', sortable: true, sortKey: 'priority' },
    { label: 'Updated', key: 'updatedAt', sortable: true, sortKey: 'createdAt' }
];
