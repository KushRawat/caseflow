import type { Toast } from 'react-hot-toast';
import { toast } from 'react-hot-toast';

import { TOAST_DURATION } from '../config/ui';

type ToastMessageProps = {
  toastInstance: Toast;
  type: 'success' | 'error' | 'info';
  message: string;
  description?: string;
};

const icons: Record<ToastMessageProps['type'], string> = {
  success: '✓',
  error: '!',
  info: 'i'
};

export const ToastMessage = ({ toastInstance, type, message, description }: ToastMessageProps) => {
  return (
    <div
      className={`toast-card ${type} ${toastInstance.visible ? 'enter' : 'exit'}`}
      role="status"
      aria-live="assertive"
      tabIndex={0}
    >
      <div className="toast-body">
        <span className="toast-icon" aria-hidden>
          {icons[type]}
        </span>
        <div className="toast-content">
          <strong>{message}</strong>
          {description && <small>{description}</small>}
        </div>
        <button
          type="button"
          className="toast-dismiss"
          aria-label="Dismiss notification"
          onClick={() => toast.dismiss(toastInstance.id)}
        >
          ×
        </button>
      </div>
      <div className="toast-progress">
        <span style={{ animationDuration: `${TOAST_DURATION}ms` }} />
      </div>
    </div>
  );
};
