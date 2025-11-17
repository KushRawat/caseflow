import { toast } from 'react-hot-toast';

import { ToastMessage } from '../components/ToastMessage';
import { TOAST_DURATION } from '../config/ui';

type ToastVariant = 'success' | 'error' | 'info';

const showToast = (type: ToastVariant, message: string, description?: string) => {
  toast.custom(
    (t) => <ToastMessage toastInstance={t} type={type} message={message} description={description} />,
    { duration: TOAST_DURATION }
  );
};

export const notifySuccess = (message: string, description?: string) => showToast('success', message, description);
export const notifyError = (message: string, description?: string) => showToast('error', message, description);
export const notifyInfo = (message: string, description?: string) => showToast('info', message, description);
