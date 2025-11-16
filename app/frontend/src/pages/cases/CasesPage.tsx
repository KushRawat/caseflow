import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchCases } from '../../api/cases';
import type { CaseCategory, CasePriority, CaseRecord, CaseStatus, PaginatedResponse } from '../../api/types';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';

const statusOptions: CaseStatus[] = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
const categoryOptions: CaseCategory[] = ['TAX', 'LICENSE', 'PERMIT'];
const priorityOptions: CasePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const PAGE_SIZE = 20;

type SortField = 'createdAt' | 'priority' | 'status' | 'caseId';

export const CasesPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    assigneeId: '',
    from: '',
    to: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<string[]>([]);

  const query = useQuery<PaginatedResponse<CaseRecord>>({
    queryKey: ['cases', filters, sortBy, sortOrder, cursor],
    queryFn: () => fetchCases({ ...filters, cursor, limit: PAGE_SIZE, sortBy, sortOrder }),
    placeholderData: (prev) => prev
  });
  const assigneesQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const cases = useMemo<CaseRecord[]>(() => query.data?.cases ?? [], [query.data]);
  const nextCursor = query.data?.nextCursor ?? null;
  const canGoBack = history.length > 0;
  const currentPage = history.length + 1;

  const refresh = () => {
    setCursor(undefined);
    setHistory([]);
    void query.refetch();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
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

  return (
    <div className="surface-card">
      <div className="toolbar">
        <BackButton />
        <button type="button" className="ghost" onClick={refresh} disabled={query.isFetching}>
          {query.isFetching ? <span className="spinner" aria-hidden /> : 'Refresh'}
        </button>
      </div>
      <h1>Cases</h1>
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <input
          placeholder="Search case ID or applicant"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />
        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
          <option value="">Status</option>
          {statusOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value="">Category</option>
          {categoryOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
        >
          <option value="">Priority</option>
          {priorityOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={filters.assigneeId}
          onChange={(event) => setFilters((prev) => ({ ...prev, assigneeId: event.target.value }))}
        >
          <option value="">Assignee</option>
          {(assigneesQuery.data?.users ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
          aria-label="To date"
        />
        <button
          type="button"
          className="ghost"
          onClick={() =>
            setFilters({
              status: '',
              category: '',
              priority: '',
              assigneeId: '',
              from: '',
              to: '',
              search: ''
            })
          }
        >
          Clear filters
        </button>
      </form>
      <div className="grid-scroll" style={{ height: 440 }}>
        <table className="table">
          <thead>
            <tr>
              {columnDefs.map((col) => (
                <th
                  key={col.label}
                  onClick={col.sortable ? () => handleSort(col.sortKey!) : undefined}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  {col.label}
                  {col.sortable && sortBy === col.sortKey ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>
                  <Link to={`/cases/${caseItem.id}`}>{caseItem.caseId}</Link>
                </td>
                <td>{caseItem.applicantName}</td>
                <td>{caseItem.status}</td>
                <td>{caseItem.category}</td>
                <td>{caseItem.priority}</td>
                <td>{new Date(caseItem.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination-controls">
        <button type="button" className="ghost" onClick={goPrev} disabled={!canGoBack || query.isFetching}>
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button type="button" className="ghost" onClick={goNext} disabled={!nextCursor || query.isFetching}>
          Next
        </button>
      </div>
    </div>
  );
};

const columnDefs: Array<{ label: string; key: keyof CaseRecord; sortable?: boolean; sortKey?: SortField }> = [
  { label: 'Case ID', key: 'caseId', sortable: true, sortKey: 'caseId' },
  { label: 'Applicant', key: 'applicantName' },
  { label: 'Status', key: 'status', sortable: true, sortKey: 'status' },
  { label: 'Category', key: 'category' },
  { label: 'Priority', key: 'priority', sortable: true, sortKey: 'priority' },
  { label: 'Updated', key: 'updatedAt', sortable: true, sortKey: 'createdAt' }
];
