import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authStore } from '../state/auth.store';
import { notifyError, notifySuccess } from '../utils/toast';
import { decodeJwt } from '../utils/jwt';
import { SessionModal } from './SessionModal';

const WARNING_WINDOW_MS = 30_000;

export const SessionManager = () => {
  const navigate = useNavigate();
  const accessToken = authStore((state) => state.accessToken);
  const refreshSession = authStore((state) => state.refreshSession);
  const signOut = authStore((state) => state.signOut);
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const warningTimeout = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);

  const clearTimers = () => {
    if (warningTimeout.current) {
      window.clearTimeout(warningTimeout.current);
      warningTimeout.current = null;
    }
    if (countdownInterval.current) {
      window.clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setCountdown(null);
    if (countdownInterval.current) {
      window.clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const openModal = (secondsRemaining: number) => {
    const initial = Math.max(0, Math.floor(secondsRemaining));
    setCountdown(initial);
    setIsOpen(true);
    if (countdownInterval.current) {
      window.clearInterval(countdownInterval.current);
    }
    countdownInterval.current = window.setInterval(() => {
      setCountdown((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
    }, 1000);
  };

  const redirectToLogin = () => navigate('/login', { replace: true });

  useEffect(() => {
    clearTimers();
    closeModal();
    if (!accessToken) return;
    const payload = decodeJwt(accessToken);
    if (!payload?.exp) return;
    const expiryMs = payload.exp * 1000;
    const timeUntilExpiry = expiryMs - Date.now();
    if (timeUntilExpiry <= 0) {
      void signOut({ message: 'Session expired. Please sign in again.' });
      return;
    }
    const warningDelay = timeUntilExpiry - WARNING_WINDOW_MS;
    if (warningDelay <= 0) {
      openModal(timeUntilExpiry / 1000);
      return;
    }
    warningTimeout.current = window.setTimeout(() => {
      openModal((expiryMs - Date.now()) / 1000);
    }, warningDelay);
    return () => {
      clearTimers();
    };
  }, [accessToken, signOut]);

  useEffect(() => {
    if (!isOpen || countdown === null) return;
    if (countdown <= 0) {
      void (async () => {
        closeModal();
        await signOut({ silent: true, message: 'Session expired. Please sign in again.' });
        redirectToLogin();
      })();
    }
  }, [countdown, isOpen, signOut]);

  const handleRefresh = async () => {
    const refreshed = await refreshSession();
    if (refreshed) {
      notifySuccess('Session extended');
      closeModal();
    } else {
      notifyError('Unable to refresh session');
      closeModal();
      await signOut({ message: 'Session expired. Please sign in again.' });
      redirectToLogin();
    }
  };

  const handleSignOut = async () => {
    closeModal();
    await signOut();
    redirectToLogin();
  };

  return <SessionModal open={isOpen} countdown={countdown} onRefresh={handleRefresh} onSignOut={handleSignOut} />;
};
