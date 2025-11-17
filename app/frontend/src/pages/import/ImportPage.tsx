import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { createImport, submitChunk } from '../../api/imports';
import type { CaseRowInput } from '../../api/types';
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
import { OfflineQueuePanel } from '../../components/OfflineQueuePanel';
import { ImportHistoryPanel } from '../../components/ImportHistoryPanel';
import { featureFlags } from '../../config/featureFlags';
import { uploadQueueStore } from '../../state/uploadQueue.store';
import { schemaFields } from '../../utils/schema';
import { notifyError, notifyInfo, notifySuccess } from '../../utils/toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const CHUNK_SIZE = 500;
const CHUNK_RETRY_LIMIT = 3;

export const ImportPage = () => {
  const queryClient = useQueryClient();
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
  const clearImportState = importStore((state) => state.clear);
  const queuedChunks = uploadQueueStore((state) => state.queuedChunks);
  const drainQueue = uploadQueueStore((state) => state.drain);
  const requeueChunk = uploadQueueStore((state) => state.requeue);
  const sourceName = importStore((state) => state.sourceName);
  const totalRows = rows.length;
  const missingRequiredFields = useMemo(
    () => schemaFields.filter((field) => field.required && !mapping[field.id]),
    [mapping]
  );
  const missingRequiredFieldIds = missingRequiredFields.map((field) => field.id);
  const mappingComplete = missingRequiredFields.length === 0;
  const validCount = validationSummary?.valid ?? 0;
  const invalidCount = validationSummary?.invalid ?? 0;
  const readyToSubmit = status === 'validated' && invalidCount === 0 && validCount > 0 && mappingComplete;
  const progressAnchor = useRef<HTMLDivElement>(null);
  const reportSectionRef = useRef<HTMLDivElement>(null);
  const cancelUploadRef = useRef(false);
  useEffect(() => {
    if (submitProgress) {
      progressAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitProgress]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportImportId, setReportImportId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (reportImportId && reportSectionRef.current) {
      reportSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [reportImportId]);

  const isValidRow = (row: (typeof rows)[number]): row is (typeof rows)[number] & { normalized: CaseRowInput } =>
    Object.keys(row.errors).length === 0 && Boolean(row.normalized);

  useEffect(() => {
    return () => {
      if (importStore.getState().submitProgress?.status === 'uploading') {
        return;
      }
      clearImportState();
    };
  }, [clearImportState]);

  const processChunks = async (chunkIndexes?: number[]) => {
    const validRows = rows.filter(isValidRow);
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

    cancelUploadRef.current = false;
    setIsSubmitting(true);
    try {
      let importId = currentImportId;
      if (!importId) {
        const job = await createImport({ sourceName: sourceName ?? 'CSV upload', totalRows: validRows.length });
        importId = job.id;
        setImportId(importId);
        setReportImportId(job.id);
      } else {
        setReportImportId(importId);
      }

      const totalToProcess = chunkPayloads.reduce((sum, chunk) => sum + chunk.rows.length, 0);

      let lastError: string | undefined;

      setSubmitProgress({
        total: totalToProcess,
        processed: 0,
        success: 0,
        failure: 0,
        failedChunks: [],
        status: 'uploading',
        created: 0,
        updated: 0,
        lastError: undefined
      });

      let processed = 0;
      let success = 0;
      let failure = 0;
      let created = 0;
      let updated = 0;
      const failedChunks: number[] = [];

      for (const chunk of chunkPayloads) {
        if (cancelUploadRef.current) {
          break;
        }
        let attempt = 0;
        let completed = false;
        while (attempt < CHUNK_RETRY_LIMIT && !completed) {
          if (cancelUploadRef.current) {
            break;
          }
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
            created += result.createdCount ?? result.successCount;
            updated += result.updatedCount ?? Math.max(0, result.successCount - (result.createdCount ?? 0));
            completed = true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Chunk upload failed';
            lastError = message;
            notifyError(`Chunk ${chunk.index + 1} failed: ${message}`);
            attempt += 1;
            if (attempt >= CHUNK_RETRY_LIMIT) {
              failedChunks.push(chunk.index);
              if (importId) {
                uploadQueueStore.getState().enqueue({
                  importId,
                  payload: {
                    chunkIndex: chunk.index,
                    rows: chunk.rows.map((row) => ({
                      rowNumber: row.rowNumber,
                      data: row.normalized!,
                      raw: row.values
                    }))
                  }
                });
              }
            } else {
              await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            }
            if (cancelUploadRef.current) {
              break;
            }
          }
        }

        if (cancelUploadRef.current) {
          break;
        }
        setSubmitProgress({
          total: totalToProcess,
          processed,
          success,
          failure,
          failedChunks,
          status: 'uploading',
          created,
          updated,
          lastError
        });
      }

      if (cancelUploadRef.current) {
        const latestProgress = importStore.getState().submitProgress;
        if (latestProgress) {
          setSubmitProgress({
            ...latestProgress,
            status: 'cancelled'
          });
        }
        uploadQueueStore.getState().clear();
        notifyInfo('Upload cancelled. You can restart whenever you are ready.');
      } else {
        setSubmitProgress({
          total: totalToProcess,
          processed,
          success,
          failure,
          failedChunks,
          status: 'done',
          created,
          updated,
          lastError: undefined
        });

        if (created || updated) {
          notifySuccess(`Import complete. Created ${created} · Updated ${updated}.`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['cases'], exact: false });
    } finally {
      setIsSubmitting(false);
      cancelUploadRef.current = false;
    }
  };

  const handleSubmit = () => processChunks();
  const handleRetryFailedChunks = () => {
    if (!submitProgress?.failedChunks.length) return;
    void processChunks(submitProgress.failedChunks);
  };

  const handleReplayQueued = async () => {
    const queue = drainQueue();
    for (const queued of queue) {
      try {
        await submitChunk(queued.importId, queued.payload);
      } catch (error) {
        requeueChunk(queued);
        throw error;
      }
    }
  };

  useEffect(() => {
    if (submitProgress?.status === 'done' && currentImportId) {
      setReportImportId(currentImportId);
    }
  }, [submitProgress?.status, currentImportId]);

  useEffect(() => {
    if (currentImportId && !reportImportId) {
      setReportImportId(currentImportId);
    }
  }, [currentImportId, reportImportId]);

  const shouldShowReport = Boolean(reportImportId);

  const isUploadActive = submitProgress?.status === 'uploading';
  const uploadLocked = isSubmitting || isUploadActive;
  const currentFileLabel = sourceName ?? 'No file selected';

  const handleCancelRequest = () => {
    if (!isUploadActive) return;
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    cancelUploadRef.current = true;
    const latestProgress = importStore.getState().submitProgress;
    if (latestProgress) {
      setSubmitProgress({ ...latestProgress, status: 'cancelled' });
    }
    uploadQueueStore.getState().clear();
    setShowCancelConfirm(false);
  };

  const handleDismissCancel = () => {
    setShowCancelConfirm(false);
  };

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
            <strong>{currentFileLabel}</strong>
          </div>
        </div>
      </section>
      <div className={`stack ${uploadLocked ? 'is-locked' : ''}`}>
        <FileUploader disabled={uploadLocked} />
        {headers.length > 0 && (
          <SchemaMappingForm
            mapping={mapping}
            headers={headers}
            missingRequiredFields={missingRequiredFieldIds}
            onChange={setMapping}
            disabled={uploadLocked}
          />
        )}
        {headers.length > 0 && !mappingComplete && (
          <div className="alert warning" role="alert">
            <p className="text-muted">
              Map the following required field{missingRequiredFields.length > 1 ? 's' : ''} to continue:
            </p>
            <ul>
              {missingRequiredFields.map((field) => (
                <li key={field.id}>{field.label}</li>
              ))}
            </ul>
          </div>
        )}
        {headers.length > 0 && featureFlags.advancedGridToolbar && (
          <ColumnManager headers={headers} columnOrder={columnOrder} onChange={setColumnOrder} disabled={uploadLocked} />
        )}
        {rows.length > 0 && (
          <>
            <FixHelpers disabled={uploadLocked} />
            {featureFlags.advancedGridToolbar && <BulkEditPanel disabled={uploadLocked} />}
            {uploadLocked && (
              <div className="alert info" role="status">
                Upload in progress. Editing is temporarily disabled to keep your data safe.
              </div>
            )}
            <section className="surface-card">
              <div className="toolbar">
                <div>
                  <h2>2. Review & validate</h2>
                  <p className="text-muted">Inline edits update instantly; validation runs client + server side.</p>
                </div>
                <div>
                  <button type="button" className="ghost" onClick={validate} disabled={uploadLocked}>
                    Validate rows
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={!readyToSubmit || uploadLocked}
                    onClick={handleSubmit}
                  >
                    {uploadLocked ? <span className="spinner" aria-hidden /> : `Submit ${validationSummary?.valid ?? 0} rows`}
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
                readOnly={uploadLocked}
              />
            </section>
            <div ref={progressAnchor}>
            {submitProgress && (
              <ImportProgress onRetryFailed={handleRetryFailedChunks} onCancelUpload={handleCancelRequest} />
            )}
          </div>
          <div ref={reportSectionRef}>{shouldShowReport && reportImportId && <ImportReport importId={reportImportId} />}</div>
          <ImportHistoryPanel activeImportId={reportImportId} onSelectReport={setReportImportId} />
            {featureFlags.offlineUploadQueue && (
              <OfflineQueuePanel queuedChunks={queuedChunks} onReplay={handleReplayQueued} />
            )}
          </>
        )}
        <ConfirmDialog
          open={showCancelConfirm}
          title="Cancel this upload?"
          description={<p>We&apos;ll stop sending any remaining chunks. Already-processed rows will stay in the system.</p>}
          confirmLabel="Stop upload"
          cancelLabel="Keep uploading"
          onConfirm={handleConfirmCancel}
          onCancel={handleDismissCancel}
        />
      </div>
    </div>
  );
};
