import { useEffect, useState } from 'react';

import type { QueuedChunk } from '../state/uploadQueue.store';

type OfflineQueuePanelProps = {
  queuedChunks: QueuedChunk[];
  onReplay: () => Promise<void>;
};

export const OfflineQueuePanel = ({ queuedChunks, onReplay }: OfflineQueuePanelProps) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    const handle = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || queuedChunks.length === 0 || isReplaying) {
      return;
    }
    let cancelled = false;
    const replay = async () => {
      setIsReplaying(true);
      try {
        await onReplay();
      } finally {
        if (!cancelled) {
          setIsReplaying(false);
        }
      }
    };
    void replay();
    return () => {
      cancelled = true;
      setIsReplaying(false);
    };
  }, [isOnline, isReplaying, onReplay, queuedChunks]);

  if (!queuedChunks.length && isOnline) {
    return null;
  }

  return (
    <section className="surface-card" aria-live="polite">
      <div className="section-title">
        <div>
          <h2>Upload queue</h2>
          <p className="text-muted">
            {isOnline ? 'Queued chunks ready to replay.' : 'You are offline; chunks will sync automatically when back online.'}
          </p>
        </div>
        <span className={`badge ${isOnline ? 'primary' : 'danger'}`}>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      {queuedChunks.length === 0 ? (
        <p className="text-muted">No pending chunks. You’re all caught up.</p>
      ) : (
        <>
          <ul className="queue-list">
            {queuedChunks.map((chunk) => (
              <li key={`${chunk.importId}-${chunk.payload.chunkIndex}`}>
                Import <strong>{chunk.importId.slice(0, 8)}</strong> · Chunk #{chunk.payload.chunkIndex + 1} ·{' '}
                {chunk.payload.rows.length} rows
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="ghost"
            disabled={!isOnline || isReplaying}
            onClick={async () => {
              setIsReplaying(true);
              try {
                await onReplay();
              } finally {
                setIsReplaying(false);
              }
            }}
          >
            {isReplaying ? <span className="spinner" aria-hidden /> : 'Replay queued chunks'}
          </button>
        </>
      )}
    </section>
  );
};
