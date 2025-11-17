import { jsx as _jsx } from "react/jsx-runtime";
import { toast } from 'react-hot-toast';
import { ToastMessage } from '../components/ToastMessage';
import { TOAST_DURATION } from '../config/ui';
const showToast = (type, message, description) => {
    toast.custom((t) => _jsx(ToastMessage, { toastInstance: t, type: type, message: message, description: description }), { duration: TOAST_DURATION });
};
export const notifySuccess = (message, description) => showToast('success', message, description);
export const notifyError = (message, description) => showToast('error', message, description);
export const notifyInfo = (message, description) => showToast('info', message, description);
