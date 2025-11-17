import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadImportErrorsCsv, fetchImport } from '../api/imports';
import type { ImportAuditEntry, ImportError } from '../api/types';

interface ImportReportProps {
  importId: string;
}

const formatAuditMessage = (audit: ImportAuditEntry) => {
  const metadata = (audit.metadata ?? {}) as Record<string, unknown>;
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

export const ImportReport = ({ importId }: ImportReportProps) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['import-report', importId],
    queryFn: () => fetchImport(importId),
    enabled: Boolean(importId),
    refetchInterval: 15000
  });

  const topErrors = useMemo<ImportError[]>(() => (data?.errors ?? []).slice(0, 5), [data?.errors]);
  const topAudits = useMemo<ImportAuditEntry[]>(() => (data?.audits ?? []).slice(0, 5), [data?.audits]);

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
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="surface-card">
        <h2>{t('import.reportHeading', { defaultValue: 'Import report' })}</h2>
        <p>Loading latest stats…</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="surface-card" aria-live="polite">
      <div className="section-title">
        <div>
          <h2>{t('import.reportHeading', { defaultValue: 'Import report' })}</h2>
          <p className="text-muted">
            {t('import.reportSubheading', { defaultValue: 'Track successes, failures, and export validation errors.' })}
          </p>
        </div>
        <span className={`badge ${data.failureCount ? 'danger' : 'success'}`}>{data.status}</span>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <h4>Total rows</h4>
          <strong>{data.totalRows}</strong>
        </div>
        <div className="stat-card">
          <h4>Successful</h4>
          <strong>{data.successCount}</strong>
        </div>
        <div className="stat-card">
          <h4>Failed</h4>
          <strong>{data.failureCount}</strong>
        </div>
        <div className="stat-card">
          <h4>Completed at</h4>
          <strong>{data.completedAt ? new Date(data.completedAt).toLocaleString() : 'Processing'}</strong>
        </div>
      </div>
      <div className="toolbar">
        <div>
          <h3>Error sample</h3>
          <p className="text-muted">Showing up to five recent issues.</p>
        </div>
        <button type="button" className="ghost" onClick={handleDownload} disabled={downloading}>
          {downloading ? <span className="spinner" aria-hidden /> : t('import.downloadCsv', { defaultValue: 'Download CSV' })}
        </button>
      </div>
      {topErrors.length === 0 ? (
        <p>{t('import.noErrors', { defaultValue: 'No errors recorded for this import 🎉' })}</p>
      ) : (
        <table className="table compact">
          <thead>
            <tr>
              <th>Row</th>
              <th>Field</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {topErrors.map((error) => (
              <tr key={error.id}>
                <td>{error.rowNumber}</td>
                <td>{error.field}</td>
                <td>{error.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="toolbar">
        <div>
          <h3>{t('import.auditHeading', { defaultValue: 'Audit trail' })}</h3>
          <p className="text-muted">{t('import.auditSubheading', { defaultValue: 'Latest events for this batch.' })}</p>
        </div>
      </div>
      {topAudits.length === 0 ? (
        <p className="text-muted">{t('import.noAudits', { defaultValue: 'No audit events yet — start an upload to log activity.' })}</p>
      ) : (
        <ul className="audit-list">
          {topAudits.map((audit) => (
            <li key={audit.id}>
              <strong>{new Date(audit.createdAt).toLocaleString()}</strong> — {formatAuditMessage(audit)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
