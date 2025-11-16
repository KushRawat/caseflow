import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { createImport, submitChunk } from '../../api/imports';
import { FileUploader } from '../../components/FileUploader';
import { FixHelpers } from '../../components/FixHelpers';
import { ImportProgress } from '../../components/ImportProgress';
import { SchemaMappingForm } from '../../components/SchemaMappingForm';
import { DataGrid } from '../../components/DataGrid';
import { importStore } from '../../state/import.store';
import { BackButton } from '../../components/BackButton';
const CHUNK_SIZE = 500;
export const ImportPage = () => {
    const headers = importStore((state) => state.headers);
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
    const submitProgress = importStore((state) => state.submitProgress);
    const sourceName = importStore((state) => state.sourceName) ?? 'uploaded.csv';
    const totalRows = rows.length;
    const validCount = validationSummary?.valid ?? 0;
    const invalidCount = validationSummary?.invalid ?? 0;
    const readyToSubmit = status === 'validated' && invalidCount === 0 && validCount > 0;
    const progressAnchor = useRef(null);
    useEffect(() => {
        if (submitProgress) {
            progressAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [submitProgress]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async () => {
        const validRows = rows.filter((row) => Object.keys(row.errors).length === 0 && row.normalized);
        if (!validRows.length)
            return;
        setIsSubmitting(true);
        try {
            let importId = currentImportId;
            if (!importId) {
                const job = await createImport({ sourceName, totalRows: rows.length });
                importId = job.id;
                setImportId(importId);
            }
            setSubmitProgress({
                total: validRows.length,
                processed: 0,
                success: 0,
                failure: 0,
                status: 'uploading'
            });
            let processed = 0;
            let success = 0;
            let failure = 0;
            for (let index = 0; index < validRows.length; index += CHUNK_SIZE) {
                const chunk = validRows.slice(index, index + CHUNK_SIZE);
                const payload = {
                    chunkIndex: index / CHUNK_SIZE,
                    rows: chunk.map((row) => ({
                        rowNumber: row.rowNumber,
                        data: row.normalized,
                        raw: row.values
                    }))
                };
                try {
                    const result = await submitChunk(importId, payload);
                    processed += chunk.length;
                    success += result.successCount;
                    failure += result.failureCount;
                }
                catch (error) {
                    failure += chunk.length;
                    setSubmitProgress({
                        total: validRows.length,
                        processed,
                        success,
                        failure,
                        status: 'done'
                    });
                    throw error;
                }
                setSubmitProgress({
                    total: validRows.length,
                    processed,
                    success,
                    failure,
                    status: processed === validRows.length ? 'done' : 'uploading'
                });
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "page-grid", children: [_jsxs("section", { className: "surface-card", children: [_jsx(BackButton, {}), _jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Case import workspace" }), _jsx("p", { className: "text-muted", children: "Upload, validate, and submit clean data in a guided, resilient pipeline." })] }), _jsx("span", { className: `badge ${readyToSubmit ? 'success' : 'primary'}`, children: readyToSubmit ? 'Ready to submit' : 'Draft' })] }), _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Total rows loaded" }), _jsx("strong", { children: totalRows })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Valid rows" }), _jsx("strong", { children: validCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Rows w/ issues" }), _jsx("strong", { children: invalidCount })] }), _jsxs("div", { className: "stat-card", children: [_jsx("h4", { children: "Current file" }), _jsx("strong", { children: sourceName })] })] })] }), _jsxs("div", { className: "stack", children: [_jsx(FileUploader, {}), headers.length > 0 && (_jsx(SchemaMappingForm, { mapping: mapping, headers: headers, onChange: setMapping })), rows.length > 0 && (_jsxs(_Fragment, { children: [_jsx(FixHelpers, {}), _jsxs("section", { className: "surface-card", children: [_jsxs("div", { className: "toolbar", children: [_jsxs("div", { children: [_jsx("h2", { children: "2. Review & validate" }), _jsx("p", { className: "text-muted", children: "Inline edits update instantly; validation runs client + server side." })] }), _jsxs("div", { children: [_jsx("button", { type: "button", className: "ghost", onClick: validate, children: "Validate rows" }), _jsx("button", { type: "button", className: "primary", disabled: !readyToSubmit || isSubmitting, onClick: handleSubmit, children: isSubmitting ? _jsx("span", { className: "spinner", "aria-hidden": true }) : `Submit ${validationSummary?.valid ?? 0} rows` })] })] }), validationSummary && (_jsxs("p", { children: ["Valid rows: ", validationSummary.valid, " \u00B7 Rows with issues: ", validationSummary.invalid] })), _jsx(DataGrid, { rows: rows, headers: headers, mapping: mapping, onEdit: updateCell })] }), _jsx("div", { ref: progressAnchor, children: submitProgress && _jsx(ImportProgress, {}) })] }))] })] }));
};
