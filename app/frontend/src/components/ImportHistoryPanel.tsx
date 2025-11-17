import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadImportErrorsCsv, listImports } from '../api/imports';
import type { ImportJob } from '../api/types';

type ImportHistoryPanelProps = {
  onSelectReport: (importId: string) => void;
  activeImportId?: string | null;
};

type CursorState = {
  history: (string | null)[];
  index: number;
};

export const ImportHistoryPanel = ({ onSelectReport, activeImportId }: ImportHistoryPanelProps) => {
  const { t } = useTranslation();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState<CursorState>({ history: [null], index: 0 });
  const currentCursor = pagination.history[pagination.index];
  const historyQuery = useQuery({
    queryKey: ['imports-history', pageSize, currentCursor],
    queryFn: () => listImports({ cursor: currentCursor ?? undefined, limit: pageSize })
  });

  const imports = useMemo<ImportJob[]>(() => {
    return historyQuery.data?.imports ?? [];
  }, [historyQuery.data]);
  const canGoNext = Boolean(historyQuery.data?.nextCursor);
  const canGoBack = pagination.index > 0;
  const currentPage = pagination.index + 1;
  const totalRecords = historyQuery.data?.total ?? 0;
  const totalPages =
    historyQuery.data && historyQuery.data.pageSize > 0
      ? Math.max(1, Math.ceil(totalRecords / historyQuery.data.pageSize))
      : 1;
  const isInitialLoading = historyQuery.isLoading && !historyQuery.data;

  const resetPagination = () => {
    setPagination({ history: [null], index: 0 });
  };

  const goNext = () => {
    if (!historyQuery.data?.nextCursor || historyQuery.isFetching) return;
    setPagination((prev) => {
      const history = [...prev.history.slice(0, prev.index + 1), historyQuery.data!.nextCursor];
      return { history, index: history.length - 1 };
    });
  };

  const goPrev = () => {
    setPagination((prev) => {
      if (prev.index === 0 || historyQuery.isFetching) return prev;
      return { ...prev, index: prev.index - 1 };
    });
  };

  const handleDownloadErrors = async (importId: string) => {
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
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="surface-card">
      <div className="section-title">
        <div>
          <h2>{t('import.historyHeading', { defaultValue: 'Recent imports' })}</h2>
          <p className="text-muted">{t('import.historySubheading', { defaultValue: 'Track previous uploads and audit events.' })}</p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => historyQuery.refetch()}
          disabled={historyQuery.isFetching}
        >
          {historyQuery.isFetching ? <span className="spinner" aria-hidden /> : 'Refresh'}
        </button>
      </div>
      <div className="page-size-control">
        <label>
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetPagination();
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isInitialLoading ? (
        <p className="text-muted">Loading history…</p>
      ) : historyQuery.isError ? (
        <p className="text-muted">We couldn&apos;t load import history right now. Please retry in a moment.</p>
      ) : imports.length === 0 ? (
        <p className="text-muted">
          {historyQuery.isFetching ? 'Loading history…' : 'No imports yet — upload a CSV to generate history.'}
        </p>
      ) : (
        <>
          <div className="grid-scroll" style={{ maxHeight: 320 }}>
            <table className="table compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Actor</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {imports.map((job) => (
                  <tr key={job.id} className={activeImportId === job.id ? 'active-row' : ''}>
                    <td>{job.id.slice(0, 6)}</td>
                    <td>{job.sourceName ?? 'CSV upload'}</td>
                    <td>{job.createdBy?.email ?? 'Unknown'}</td>
                    <td>
                      <span className={`badge ${job.status === 'FAILED' ? 'danger' : job.status === 'COMPLETED' ? 'success' : 'secondary'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      {job.successCount}/{job.totalRows}
                    </td>
                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="history-actions">
                        <button type="button" className="ghost" onClick={() => onSelectReport(job.id)}>
                          {t('import.viewReport', { defaultValue: 'View report' })}
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => void handleDownloadErrors(job.id)}
                          disabled={downloadingId === job.id}
                        >
                          {downloadingId === job.id ? <span className="spinner" aria-hidden /> : t('import.downloadCsv', { defaultValue: 'Download CSV' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted" style={{ marginTop: '0.35rem' }}>
            Showing up to {pageSize} imports per page · Total {totalRecords} records.
          </p>
        </>
      )}
      <div className="pagination-controls">
        <button type="button" className="ghost" onClick={goPrev} disabled={!canGoBack || historyQuery.isFetching}>
          Previous
        </button>
        <span>
          Page {currentPage} {totalPages > 1 ? `of ${totalPages}` : ''}
        </span>
        <button type="button" className="ghost" onClick={goNext} disabled={!canGoNext || historyQuery.isFetching}>
          Next
        </button>
      </div>
    </section>
  );
};
