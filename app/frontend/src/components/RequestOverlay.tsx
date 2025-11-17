import { requestStore } from '../state/request.store';
import { importStore } from '../state/import.store';

export const RequestOverlay = () => {
  const pending = requestStore((state) => state.pending);
  const uploadActive = importStore((state) => state.submitProgress?.status === 'uploading');
  if (!pending || uploadActive) return null;

  return (
    <div className="request-overlay" role="status" aria-live="polite">
      <div className="overlay-card">
        <span className="spinner large" aria-hidden />
        <p>Working on your request…</p>
      </div>
    </div>
  );
};
