import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { authStore } from '../state/auth.store';

export const UnauthRoute = ({ children }: { children: JSX.Element }) => {
  const status = authStore((state) => state.status);
  const user = authStore((state) => state.user);
  const hydrate = authStore((state) => state.hydrate);

  useEffect(() => {
    if (status === 'idle') {
      void hydrate();
    }
  }, [status, hydrate]);

  if (status === 'loading') {
    return <div className="loader">Loading…</div>;
  }

  if (user) {
    return <Navigate to="/import" replace />;
  }

  return children;
};
