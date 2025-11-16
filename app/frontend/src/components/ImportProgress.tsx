import { importStore } from '../state/import.store';

interface ImportProgressProps {
  onRetryFailed?: () => void;
}

export const ImportProgress = ({ onRetryFailed }: ImportProgressProps) => {
  const progress = importStore((state) => state.submitProgress);
  if (!progress) return null;

  const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
  const hasFailedChunks = progress.failedChunks.length > 0;

  return (
    <section className="surface-card" aria-live="polite">
      <div className="section-title">
        <div>
          <h2>Upload progress</h2>
          <p className="text-muted">We batch rows in chunks of 500 and retry failed chunks automatically.</p>
        </div>
        <span className={`badge ${hasFailedChunks || progress.failure ? 'danger' : 'success'}`}>{percent}%</span>
      </div>
      <div className="progress-meter">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      <p>
        {progress.processed}/{progress.total} rows processed · Success {progress.success} · Failed {progress.failure}
      </p>
      {hasFailedChunks && (
        <div className="alert danger">
          <p>
            {progress.failedChunks.length} chunk(s) still need attention. You can retry them without re-uploading the entire file.
          </p>
          <button type="button" className="ghost" onClick={onRetryFailed}>
            Retry failed chunks
          </button>
        </div>
      )}
    </section>
  );
};
