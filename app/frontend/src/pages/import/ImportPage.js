import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    const missingRequiredFields = useMemo(() => schemaFields.filter((field) => field.required && !mapping[field.id]), [mapping]);
    const missingRequiredFieldIds = missingRequiredFields.map((field) => field.id);
    const mappingComplete = missingRequiredFields.length === 0;
    const validCount = validationSummary?.valid ?? 0;
    const invalidCount = validationSummary?.invalid ?? 0;
    const readyToSubmit = status === 'validated' && invalidCount === 0 && validCount > 0 && mappingComplete;
    const progressAnchor = useRef(null);
    const reportSectionRef = useRef(null);
    const cancelUploadRef = useRef(false);
    useEffect(() => {
        if (submitProgress) {
            progressAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [submitProgress]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportImportId, setReportImportId] = useState(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    useEffect(() => {
        if (reportImportId && reportSectionRef.current) {
            reportSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [reportImportId]);
    const isValidRow = (row) => Object.keys(row.errors).length === 0 && Boolean(row.normalized);
    useEffect(() => {
        return () => {
            if (importStore.getState().submitProgress?.status === 'uploading') {
                return;
            }
            clearImportState();
        };
    }, [clearImportState]);
    const processChunks = async (chunkIndexes) => {
        const validRows = rows.filter(isValidRow);
        if (!validRows.length)
            return;
        const chunkCount = Math.ceil(validRows.length / CHUNK_SIZE);
        const indexesToProcess = chunkIndexes ?? Array.from({ length: chunkCount }, (_value, index) => index);
        const chunkPayloads = indexesToProcess
            .map((index) => ({
            index,
            rows: validRows.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
        }))
            .filter((chunk) => chunk.rows.length > 0);
        if (chunkPayloads.length === 0)
            return;
        cancelUploadRef.current = false;
        setIsSubmitting(true);
        try {
            let importId = currentImportId;
            if (!importId) {
                const job = await createImport({ sourceName: sourceName ?? 'CSV upload', totalRows: validRows.length });
                importId = job.id;
                setImportId(importId);
                setReportImportId(job.id);
            }
            else {
                setReportImportId(importId);
            }
            const totalToProcess = chunkPayloads.reduce((sum, chunk) => sum + chunk.rows.length, 0);
            let lastError;
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
            const failedChunks = [];
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
                        const result = await submitChunk(importId, payload);
                        processed += chunk.rows.length;
                        success += result.successCount;
                        failure += result.failureCount;
                        created += result.createdCount ?? result.successCount;
                        updated += result.updatedCount ?? Math.max(0, result.successCount - (result.createdCount ?? 0));
                        completed = true;
                    }
                    catch (error) {
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
                                            data: row.normalized,
                                            raw: row.values
                                        }))
                                    }
                                });
                            }
                        }
                        else {
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
            }
            else {
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
        }
        finally {
            setIsSubmitting(false);
            cancelUploadRef.current = false;
        }
    };
    const handleSubmit = () => processChunks();
    const handleRetryFailedChunks = () => {
        if (!submitProgress?.failedChunks.length)
            return;
        void processChunks(submitProgress.failedChunks);
    };
    const handleReplayQueued = async () => {
        const queue = drainQueue();
        for (const queued of queue) {
            try {
                await submitChunk(queued.importId, queued.payload);
            }
            catch (error) {
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
        if (!isUploadActive)
            return;
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
    return (_jsxs("div", { className: "page-grid", children: [_jsxs("section", { className: "surface-card", children: [_jsx(BackButton, {}), _jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Case import workspace" }), _jsx("p", { className: "text-muted", children: "Upload, validate, and submit clean data in a guided, resilient pipeline." })] }), _jsx("span", { className: `badge ${readyToSubmit ? 'success' : 'primary'}`, children: readyToSubmit ? 'Ready to submit' : 'Draft' })] }), _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total rows loaded" }), _jsx("strong", { children: totalRows })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Valid rows" }), _jsx("strong", { children: validCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Rows w/ issues" }), _jsx("strong", { children: invalidCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Current file" }), _jsx("strong", { children: currentFileLabel })] })] })] }), _jsxs("div", { className: `stack ${uploadLocked ? 'is-locked' : ''}`, children: [_jsx(FileUploader, { disabled: uploadLocked }), headers.length > 0 && (_jsx(SchemaMappingForm, { mapping: mapping, headers: headers, missingRequiredFields: missingRequiredFieldIds, onChange: setMapping, disabled: uploadLocked })), headers.length > 0 && !mappingComplete && (_jsxs("div", { className: "alert warning", role: "alert", children: [_jsxs("p", { className: "text-muted", children: ["Map the following required field", missingRequiredFields.length > 1 ? 's' : '', " to continue:"] }), _jsx("ul", { children: missingRequiredFields.map((field) => (_jsx("li", { children: field.label }, field.id))) })] })), headers.length > 0 && featureFlags.advancedGridToolbar && (_jsx(ColumnManager, { headers: headers, columnOrder: columnOrder, onChange: setColumnOrder, disabled: uploadLocked })), rows.length > 0 && (_jsxs(_Fragment, { children: [_jsx(FixHelpers, { disabled: uploadLocked }), featureFlags.advancedGridToolbar && _jsx(BulkEditPanel, { disabled: uploadLocked }), uploadLocked && (_jsx("div", { className: "alert info", role: "status", children: "Upload in progress. Editing is temporarily disabled to keep your data safe." })), _jsxs("section", { className: "surface-card", children: [_jsxs("div", { className: "toolbar", children: [_jsxs("div", { children: [_jsx("h2", { children: "2. Review & validate" }), _jsx("p", { className: "text-muted", children: "Inline edits update instantly; validation runs client + server side." })] }), _jsxs("div", { children: [_jsx("button", { type: "button", className: "ghost", onClick: validate, disabled: uploadLocked, children: "Validate rows" }), _jsx("button", { type: "button", className: "primary", disabled: !readyToSubmit || uploadLocked, onClick: handleSubmit, children: uploadLocked ? _jsx("span", { className: "spinner", "aria-hidden": true }) : `Submit ${validationSummary?.valid ?? 0} rows` })] })] }), validationSummary && (_jsxs("p", { children: ["Valid rows: ", validationSummary.valid, " \u00B7 Rows with issues: ", validationSummary.invalid] })), _jsx(DataGrid, { rows: rows, headers: headers, columnOrder: columnOrder, mapping: mapping, selectedRowIds: selectedRowIds, onToggleRow: toggleRowSelection, onSelectAll: selectAllRows, onEdit: updateCell, readOnly: uploadLocked })] }), _jsx("div", { ref: progressAnchor, children: submitProgress && (_jsx(ImportProgress, { onRetryFailed: handleRetryFailedChunks, onCancelUpload: handleCancelRequest })) }), _jsx("div", { ref: reportSectionRef, children: shouldShowReport && reportImportId && _jsx(ImportReport, { importId: reportImportId }) }), _jsx(ImportHistoryPanel, { activeImportId: reportImportId, onSelectReport: setReportImportId }), featureFlags.offlineUploadQueue && (_jsx(OfflineQueuePanel, { queuedChunks: queuedChunks, onReplay: handleReplayQueued }))] })), _jsx(ConfirmDialog, { open: showCancelConfirm, title: "Cancel this upload?", description: _jsx("p", { children: "We'll stop sending any remaining chunks. Already-processed rows will stay in the system." }), confirmLabel: "Stop upload", cancelLabel: "Keep uploading", onConfirm: handleConfirmCancel, onCancel: handleDismissCancel })] })] }));
};
