import { Link } from 'react-router-dom';

import { importStore } from '../state/import.store';

export const UploadDock = () => {
  const progress = importStore((state) => state.submitProgress);
  if (!progress || (progress.status === 'idle' && progress.processed === 0)) {
    return null;
  }

  const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
  const statusLabel = progress.status === 'uploading' ? 'Uploading' : progress.status === 'done' ? 'Finished' : 'Paused';

  return (
    <div className="upload-dock" aria-live="polite">
      <div className="dock-copy">
        <span className="dock-label">{statusLabel}</span>
        <strong>
          {progress.processed}/{progress.total} rows
        </strong>
      </div>
      <div className="dock-meter">
        <div className="progress-meter mini">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <Link to="/import" className="ghost-link compact">
          View upload
        </Link>
      </div>
    </div>
  );
};
