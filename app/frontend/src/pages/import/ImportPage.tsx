import { useEffect, useRef, useState } from 'react';

import { createImport, submitChunk } from '../../api/imports';
import { FileUploader } from '../../components/FileUploader';
import { FixHelpers } from '../../components/FixHelpers';
import { ImportProgress } from '../../components/ImportProgress';
import { SchemaMappingForm } from '../../components/SchemaMappingForm';
import { DataGrid } from '../../components/DataGrid';
import { importStore } from '../../state/import.store';
import { BackButton } from '../../components/BackButton';
import { ColumnManager } from '../../components/ColumnManager';
import { BulkEditPanel } from '../../components/BulkEditPanel';
import { ImportReport } from '../../components/ImportReport';

const CHUNK_SIZE = 500;
const CHUNK_RETRY_LIMIT = 3;

export const ImportPage = () => {
  const headers = importStore((state) => state.headers);
  const columnOrder = importStore((state) => state.columnOrder);
  const rows = importStore((state) => state.rows);
  const mapping = importStore((state) => state.mapping);
  const status = importStore((state) => state.status);
  const validationSummary = importStore((state) => state.validationSummary);
  const setMapping = importStore((state) => state.setMapping);
  const updateCell = importStore((state) => state.updateCell);
  const validate = importStore((state) => state.validate);
  const currentImportId = importStore((state) => state.currentImportId);
  const setImportId = importStore((state) => state.setImportId);
  const setSubmitProgress = importStore((state) => state.setSubmitProgress);
  const setColumnOrder = importStore((state) => state.setColumnOrder);
  const submitProgress = importStore((state) => state.submitProgress);
  const toggleRowSelection = importStore((state) => state.toggleRowSelection);
  const selectAllRows = importStore((state) => state.selectAllRows);
  const selectedRowIds = importStore((state) => state.selectedRowIds);
  const sourceName = importStore((state) => state.sourceName) ?? 'uploaded.csv';
  const totalRows = rows.length;
  const validCount = validationSummary?.valid ?? 0;
  const invalidCount = validationSummary?.invalid ?? 0;
  const readyToSubmit = status === 'validated' && invalidCount === 0 && validCount > 0;
  const progressAnchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submitProgress) {
      progressAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitProgress]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const processChunks = async (chunkIndexes?: number[]) => {
    const validRows = rows.filter((row) => Object.keys(row.errors).length === 0 && row.normalized);
    if (!validRows.length) return;

    const chunkCount = Math.ceil(validRows.length / CHUNK_SIZE);
    const indexesToProcess = chunkIndexes ?? Array.from({ length: chunkCount }, (_value, index) => index);
    const chunkPayloads = indexesToProcess
      .map((index) => ({
        index,
        rows: validRows.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
      }))
      .filter((chunk) => chunk.rows.length > 0);

    if (chunkPayloads.length === 0) return;

    setIsSubmitting(true);
    try {
      let importId = currentImportId;
      if (!importId) {
        const job = await createImport({ sourceName, totalRows: rows.length });
        importId = job.id;
        setImportId(importId);
      }

      const totalToProcess = chunkPayloads.reduce((sum, chunk) => sum + chunk.rows.length, 0);

      setSubmitProgress({
        total: totalToProcess,
        processed: 0,
        success: 0,
        failure: 0,
        failedChunks: [],
        status: 'uploading'
      });

      let processed = 0;
      let success = 0;
      let failure = 0;
      const failedChunks: number[] = [];

      for (const chunk of chunkPayloads) {
        let attempt = 0;
        let completed = false;
        while (attempt < CHUNK_RETRY_LIMIT && !completed) {
          try {
            const payload = {
              chunkIndex: chunk.index,
              rows: chunk.rows.map((row) => ({
                rowNumber: row.rowNumber,
                data: row.normalized,
                raw: row.values
              }))
            };
            const result = await submitChunk(importId!, payload);
            processed += chunk.rows.length;
            success += result.successCount;
            failure += result.failureCount;
            completed = true;
          } catch (error) {
            attempt += 1;
            if (attempt >= CHUNK_RETRY_LIMIT) {
              failedChunks.push(chunk.index);
            } else {
              await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            }
          }
        }

        setSubmitProgress({
          total: totalToProcess,
          processed,
          success,
          failure,
          failedChunks,
          status: 'uploading'
        });
      }

      setSubmitProgress({
        total: totalToProcess,
        processed,
        success,
        failure,
        failedChunks,
        status: 'done'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => processChunks();
  const handleRetryFailedChunks = () => {
    if (!submitProgress?.failedChunks.length) return;
    void processChunks(submitProgress.failedChunks);
  };

  const shouldShowReport = submitProgress?.status === 'done' && currentImportId;

  return (
    <div className="page-grid">
      <section className="surface-card">
        <BackButton />
        <div className="section-title">
          <div>
            <h2>Case import workspace</h2>
            <p className="text-muted">Upload, validate, and submit clean data in a guided, resilient pipeline.</p>
          </div>
          <span className={`badge ${readyToSubmit ? 'success' : 'primary'}`}>
            {readyToSubmit ? 'Ready to submit' : 'Draft' }
          </span>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <h4>Total rows loaded</h4>
            <strong>{totalRows}</strong>
          </div>
          <div className="stat-card">
            <h4>Valid rows</h4>
            <strong>{validCount}</strong>
          </div>
          <div className="stat-card">
            <h4>Rows w/ issues</h4>
            <strong>{invalidCount}</strong>
          </div>
          <div className="stat-card">
            <h4>Current file</h4>
            <strong>{sourceName}</strong>
          </div>
        </div>
      </section>
      <div className="stack">
        <FileUploader />
        {headers.length > 0 && (
          <SchemaMappingForm mapping={mapping} headers={headers} onChange={setMapping} />
        )}
        {headers.length > 0 && (
          <ColumnManager headers={headers} columnOrder={columnOrder} onChange={setColumnOrder} />
        )}
        {rows.length > 0 && (
          <>
            <FixHelpers />
            <BulkEditPanel />
            <section className="surface-card">
              <div className="toolbar">
                <div>
                  <h2>2. Review & validate</h2>
                  <p className="text-muted">Inline edits update instantly; validation runs client + server side.</p>
                </div>
                <div>
                  <button type="button" className="ghost" onClick={validate}>
                    Validate rows
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={!readyToSubmit || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? <span className="spinner" aria-hidden /> : `Submit ${validationSummary?.valid ?? 0} rows`}
                  </button>
                </div>
              </div>
              {validationSummary && (
                <p>
                  Valid rows: {validationSummary.valid} · Rows with issues: {validationSummary.invalid}
                </p>
              )}
              <DataGrid
                rows={rows}
                headers={headers}
                columnOrder={columnOrder}
                mapping={mapping}
                selectedRowIds={selectedRowIds}
                onToggleRow={toggleRowSelection}
                onSelectAll={selectAllRows}
                onEdit={updateCell}
              />
            </section>
            <div ref={progressAnchor}>
              {submitProgress && <ImportProgress onRetryFailed={handleRetryFailedChunks} />}
            </div>
            {shouldShowReport && currentImportId && <ImportReport importId={currentImportId} />}
          </>
        )}
      </div>
    </div>
  );
};
