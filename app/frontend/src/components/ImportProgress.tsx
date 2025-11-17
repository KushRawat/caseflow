import { importStore } from '../state/import.store';

interface ImportProgressProps {
  onRetryFailed?: () => void;
  onCancelUpload?: () => void;
}

export const ImportProgress = ({ onRetryFailed, onCancelUpload }: ImportProgressProps) => {
  const progress = importStore((state) => state.submitProgress);
  if (!progress) return null;

  const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
  const hasFailedChunks = progress.failedChunks.length > 0;
  const canCancel = progress.status === 'uploading' && Boolean(onCancelUpload);
  const chunkList = hasFailedChunks
    ? progress.failedChunks
        .slice(0, 5)
        .map((index) => index + 1)
        .join(', ')
    : '';

  return (
    <section className="surface-card upload-progress" aria-live="polite">
      <div className="section-title">
        <div>
          <h2>Upload progress</h2>
          <p className="text-muted">We batch rows in chunks of 500 and retry failed chunks automatically.</p>
        </div>
        <span className={`badge ${hasFailedChunks || progress.failure ? 'danger' : 'success'}`}>{percent}%</span>
      </div>
      <div className="upload-progress-bar">
        <div className="progress-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <span className="progress-label">{percent}%</span>
        {canCancel && (
          <button type="button" className="ghost" onClick={onCancelUpload}>
            Cancel upload
          </button>
        )}
      </div>
      <p>
        {progress.processed}/{progress.total} rows processed · Success {progress.success} · Failed {progress.failure}
      </p>
      <p className="text-muted">
        Created {progress.created} · Updated {progress.updated}
      </p>
      {progress.status === 'cancelled' && <p className="text-muted">Upload cancelled. Nothing new was sent after your stop.</p>}
      {progress.lastError && (
        <div className="alert warning">
          <strong>Latest error:</strong> {progress.lastError}
        </div>
      )}
      {hasFailedChunks && (
        <div className="alert danger">
          <p>
            {progress.failedChunks.length} chunk(s) still need attention.
            {chunkList && <span> Affected indexes: {chunkList}{progress.failedChunks.length > 5 ? '…' : ''}.</span>}
            You can retry them without re-uploading the entire file.
          </p>
          <button type="button" className="ghost" onClick={onRetryFailed}>
            Retry failed chunks
          </button>
        </div>
      )}
    </section>
  );
};
