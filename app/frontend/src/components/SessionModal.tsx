type SessionModalProps = {
  open: boolean;
  countdown: number | null;
  onRefresh: () => void;
  onSignOut: () => void;
};

export const SessionModal = ({ open, countdown, onRefresh, onSignOut }: SessionModalProps) => {
  if (!open || countdown === null) return null;

  return (
    <div className="session-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="session-title">
      <div className="session-modal">
        <h2 id="session-title">Session expiring soon</h2>
        <p>
          We&apos;ll sign you out in <strong>{countdown}</strong> second{countdown === 1 ? '' : 's'}.
        </p>
        <div className="session-actions">
          <button type="button" className="ghost" onClick={onSignOut}>
            Sign out
          </button>
          <button type="button" className="primary" onClick={onRefresh}>
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
};
