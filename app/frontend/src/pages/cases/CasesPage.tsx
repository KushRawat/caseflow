import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { fetchCases } from '../../api/cases';
import type { CaseCategory, CasePriority, CaseRecord, CaseStatus, CasesResponse } from '../../api/types';
import { BackButton } from '../../components/BackButton';
import { listUsers } from '../../api/users';

const statusOptions: CaseStatus[] = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
const categoryOptions: CaseCategory[] = ['TAX', 'LICENSE', 'PERMIT'];
const priorityOptions: CasePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type SortField = 'createdAt' | 'priority' | 'status' | 'caseId';

type CursorState = {
  history: (string | null)[];
  index: number;
};

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
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState<CursorState>({ history: [null], index: 0 });
  const currentCursor = pagination.history[pagination.index];

  const resetPagination = () => {
    setPagination({ history: [null], index: 0 });
  };

  const query = useQuery<CasesResponse>({
    queryKey: ['cases', filters, sortBy, sortOrder, pageSize, currentCursor],
    queryFn: () =>
      fetchCases({
        ...filters,
        limit: pageSize,
        cursor: currentCursor ?? undefined,
        sortBy,
        sortOrder
      })
  });
  const assigneesQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const cases = useMemo<CaseRecord[]>(() => query.data?.cases ?? [], [query.data]);
  const totalRecords = query.data?.total ?? 0;
  const totalPages =
    query.data && query.data.pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / query.data.pageSize)) : 1;
  const canGoNext = Boolean(query.data?.nextCursor);
  const canGoBack = pagination.index > 0;
  const currentPage = pagination.index + 1;

  const getStatusLabel = (value: CaseStatus) => t(`cases.status.${value}`, { defaultValue: value });
  const getCategoryLabel = (value: CaseCategory) => t(`cases.categories.${value}`, { defaultValue: value });
  const getPriorityLabel = (value: CasePriority) => t(`cases.priorities.${value}`, { defaultValue: value });

  const updateFilters = (partial: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    resetPagination();
  };

  const refresh = () => {
    void query.refetch();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    resetPagination();
  };

  const goNext = () => {
    if (!query.data?.nextCursor || query.isFetching) return;
    setPagination((prev) => {
      const nextHistory = [...prev.history.slice(0, prev.index + 1), query.data!.nextCursor];
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

  return (
    <div className="surface-card">
      <div className="toolbar">
        <BackButton />
        <button type="button" className="ghost" onClick={refresh} disabled={query.isFetching}>
          {query.isFetching ? <span className="spinner" aria-hidden /> : t('cases.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>
      <h1>{t('cases.title', { defaultValue: 'Cases' })}</h1>
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <input
          placeholder={t('cases.searchPlaceholder', { defaultValue: 'Search case ID or applicant' })}
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
        />
        <select value={filters.status} onChange={(event) => updateFilters({ status: event.target.value })}>
          <option value="">{t('cases.filters.status', { defaultValue: 'Status' })}</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {getStatusLabel(option)}
            </option>
          ))}
        </select>
        <select value={filters.category} onChange={(event) => updateFilters({ category: event.target.value })}>
          <option value="">{t('cases.filters.category', { defaultValue: 'Category' })}</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {getCategoryLabel(option)}
            </option>
          ))}
        </select>
        <select value={filters.priority} onChange={(event) => updateFilters({ priority: event.target.value })}>
          <option value="">{t('cases.filters.priority', { defaultValue: 'Priority' })}</option>
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {getPriorityLabel(option)}
            </option>
          ))}
        </select>
        <select value={filters.assigneeId} onChange={(event) => updateFilters({ assigneeId: event.target.value })}>
          <option value="">{t('cases.filters.assignee', { defaultValue: 'Assignee' })}</option>
          {(assigneesQuery.data?.users ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => updateFilters({ from: event.target.value })}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(event) => updateFilters({ to: event.target.value })}
          aria-label="To date"
        />
        <button
          type="button"
          className="ghost"
          onClick={() => {
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
          }}
        >
          {t('cases.clearFilters', { defaultValue: 'Clear filters' })}
        </button>
      </form>
      <div className="page-size-control">
        <label>
          {t('cases.rowsPerPage', { defaultValue: 'Rows per page' })}
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetPagination();
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-scroll cases-table-wrapper">
        <table className="table cases-table">
          <thead>
            <tr>
              {columnDefs.map((col) => (
                <th
                  key={col.label}
                  onClick={col.sortable ? () => handleSort(col.sortKey!) : undefined}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  {t(`cases.table.${col.i18nKey}`, { defaultValue: col.label })}
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
                <td>{getStatusLabel(caseItem.status)}</td>
                <td>{getCategoryLabel(caseItem.category)}</td>
                <td>{getPriorityLabel(caseItem.priority)}</td>
                <td>{new Date(caseItem.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted" style={{ marginTop: '0.35rem' }}>
        {t('cases.summary', {
          count: pageSize,
          total: totalRecords,
          defaultValue: `Showing up to ${pageSize} cases per page · Total ${totalRecords} records.`
        })}
      </p>
      <div className="pagination-controls">
        <button type="button" className="ghost" onClick={goPrev} disabled={!canGoBack || query.isFetching}>
          {t('cases.pagination.previous', { defaultValue: 'Previous' })}
        </button>
        <span>
          {t('cases.pagination.page', {
            current: currentPage,
            total: totalPages,
            defaultValue: `Page ${currentPage} of ${totalPages}`
          })}
        </span>
        <button type="button" className="ghost" onClick={goNext} disabled={!canGoNext || query.isFetching}>
          {t('cases.pagination.next', { defaultValue: 'Next' })}
        </button>
      </div>
    </div>
  );
};

const columnDefs: Array<{ label: string; key: keyof CaseRecord; sortable?: boolean; sortKey?: SortField; i18nKey: string }> = [
  { label: 'Case ID', key: 'caseId', sortable: true, sortKey: 'caseId', i18nKey: 'caseId' },
  { label: 'Applicant', key: 'applicantName', i18nKey: 'applicant' },
  { label: 'Status', key: 'status', sortable: true, sortKey: 'status', i18nKey: 'status' },
  { label: 'Category', key: 'category', i18nKey: 'category' },
  { label: 'Priority', key: 'priority', sortable: true, sortKey: 'priority', i18nKey: 'priority' },
  { label: 'Updated', key: 'updatedAt', sortable: true, sortKey: 'createdAt', i18nKey: 'updated' }
];
