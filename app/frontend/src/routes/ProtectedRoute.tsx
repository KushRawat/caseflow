import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { authStore } from '../state/auth.store';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const status = authStore((state) => state.status);
  const user = authStore((state) => state.user);
  const accessToken = authStore((state) => state.accessToken);
  const hydrate = authStore((state) => state.hydrate);
  const signOut = authStore((state) => state.signOut);

  useEffect(() => {
    if (status === 'idle') {
      void hydrate();
    }
  }, [status, hydrate]);

  useEffect(() => {
    if (status === 'authenticated' && !accessToken) {
      void signOut();
    }
  }, [status, accessToken, signOut]);

  if (status === 'loading' || status === 'idle') {
    return <div className="loader" role="status" aria-live="polite">Loading…</div>;
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
