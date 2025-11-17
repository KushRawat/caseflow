import { useDropzone } from 'react-dropzone';

import { useCsvParser } from '../hooks/useCsvParser';
import { importStore } from '../state/import.store';

type FileUploaderProps = {
  disabled?: boolean;
};

export const FileUploader = ({ disabled = false }: FileUploaderProps) => {
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
          className: `dropzone ${isDragActive ? 'active' : ''} ${hasFile ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`,
          title: hasFile ? `${sourceName ?? 'Uploaded file'} loaded` : disabled ? 'Uploading in progress' : 'Click to browse or drag a CSV file',
          'aria-disabled': disabled
        })}
      >
        <input {...getInputProps()} aria-label="Upload CSV" disabled={disabled} />
        <p>{disabled ? 'Upload locked while we finish processing' : isDragActive ? 'Drop to upload' : 'Drag & drop or click to browse'}</p>
        {hasFile ? (
          <small>
            Loaded <strong>{sourceName ?? 'Uploaded file'}</strong> · {rowCount} rows detected
          </small>
        ) : (
          <small>{disabled ? 'Please wait for the current upload to finish.' : 'Accepted: .csv · We auto-detect headers and schemas.'}</small>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
};
