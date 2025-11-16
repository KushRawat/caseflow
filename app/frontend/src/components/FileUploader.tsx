import { useDropzone } from 'react-dropzone';

import { useCsvParser } from '../hooks/useCsvParser';
import { importStore } from '../state/import.store';

export const FileUploader = () => {
  const { parseFile, status, error } = useCsvParser();
  const rowCount = importStore((state) => state.rows.length);
  const sourceName = importStore((state) => state.sourceName);
  const hasFile = rowCount > 0;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    onDropAccepted(files) {
      const file = files[0];
      if (file) {
        parseFile(file);
      }
    }
  });
  return (
    <section className="surface-card" aria-labelledby="upload-title">
      <div className="section-title">
        <div>
          <h2 id="upload-title">1. Upload your CSV</h2>
          <p className="text-muted">Drop up to 50k rows—mapping and validation happen instantly.</p>
        </div>
        <span className="badge primary">{status}</span>
      </div>
      <div
        {...getRootProps({
          className: `dropzone ${isDragActive ? 'active' : ''} ${hasFile ? 'has-file' : ''}`,
          title: hasFile ? `${sourceName} uploaded` : 'Click to browse or drag a CSV file'
        })}
      >
        <input {...getInputProps()} aria-label="Upload CSV" />
        <p>{isDragActive ? 'Drop to upload' : 'Drag & drop or click to browse'}</p>
        {hasFile ? (
          <small>
            Loaded <strong>{sourceName}</strong> · {rowCount} rows detected
          </small>
        ) : (
          <small>Accepted: .csv · We auto-detect headers and schemas.</small>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
};
