import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDropzone } from 'react-dropzone';
import { useCsvParser } from '../hooks/useCsvParser';
import { importStore } from '../state/import.store';
export const FileUploader = ({ disabled = false }) => {
    const { parseFile, status, error } = useCsvParser();
    const rowCount = importStore((state) => state.rows.length);
    const sourceName = importStore((state) => state.sourceName);
    const hasFile = rowCount > 0;
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'text/csv': ['.csv'] },
        multiple: false,
        disabled,
        onDropAccepted(files) {
            const file = files[0];
            if (file) {
                parseFile(file);
            }
        }
    });
    return (_jsxs("section", { className: "surface-card", "aria-labelledby": "upload-title", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { id: "upload-title", children: "1. Upload your CSV" }), _jsx("p", { className: "text-muted", children: "Drop up to 50k rows\u2014mapping and validation happen instantly." })] }), _jsx("span", { className: "badge primary", children: status })] }), _jsxs("div", { ...getRootProps({
                    className: `dropzone ${isDragActive ? 'active' : ''} ${hasFile ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`,
                    title: hasFile ? `${sourceName ?? 'Uploaded file'} loaded` : disabled ? 'Uploading in progress' : 'Click to browse or drag a CSV file',
                    'aria-disabled': disabled
                }), children: [_jsx("input", { ...getInputProps(), "aria-label": "Upload CSV", disabled: disabled }), _jsx("p", { children: disabled ? 'Upload locked while we finish processing' : isDragActive ? 'Drop to upload' : 'Drag & drop or click to browse' }), hasFile ? (_jsxs("small", { children: ["Loaded ", _jsx("strong", { children: sourceName ?? 'Uploaded file' }), " \u00B7 ", rowCount, " rows detected"] })) : (_jsx("small", { children: disabled ? 'Please wait for the current upload to finish.' : 'Accepted: .csv · We auto-detect headers and schemas.' })), error && _jsx("p", { className: "error-text", children: error })] })] }));
};
