import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginApi, logout as logoutApi, me, refresh } from '../api/auth';
import { registerAuthHandlers, setTokenProvider } from '../api/client';
import type { User } from '../api/types';
import { notifyError, notifySuccess } from '../utils/toast';

type AuthState = {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error?: string;
};

export type AuthStore = AuthState & {
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  hydrate: () => Promise<void>;
  signOut: (options?: { silent?: boolean; message?: string }) => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

let refreshPromise: Promise<boolean> | null = null;

export const authStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      status: 'idle',
      async signIn(payload) {
        set({ status: 'loading', error: undefined });
        try {
          const result = await loginApi(payload);
          set({
            status: 'authenticated',
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          });
        } catch (error) {
          set({ status: 'error', error: (error as Error).message });
          throw error;
        }
      },
      async hydrate() {
        const { accessToken, user, refreshToken } = get();
        if (user && accessToken) {
          set({ status: 'authenticated' });
          return;
        }

        if (!refreshToken) {
          set({ status: 'idle', user: undefined, accessToken: undefined, refreshToken: undefined });
          return;
        }

        const refreshed = await get().refreshSession();
        if (!refreshed) {
          set({ status: 'idle', user: undefined, accessToken: undefined, refreshToken: undefined });
        }
      },
      async signOut(options) {
        const token = get().refreshToken;
        try {
          await logoutApi(token);
          if (!options?.silent) {
            notifySuccess('Signed out');
          }
        } catch (error) {
          if (!options?.silent) {
            notifyError((error as Error).message ?? 'Unable to sign out');
          }
        } finally {
          set({ user: undefined, accessToken: undefined, refreshToken: undefined, status: 'idle' });
          if (options?.message) {
            notifyError(options.message);
          }
        }
      },
      async refreshSession() {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        if (refreshPromise) return refreshPromise;
        refreshPromise = (async () => {
          try {
            const refreshed = await refresh(refreshToken);
            const profile = await me();
            set({
              status: 'authenticated',
              user: profile.user,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken
            });
            return true;
          } catch {
            set({ status: 'idle', user: undefined, accessToken: undefined, refreshToken: undefined });
            return false;
          } finally {
            refreshPromise = null;
          }
        })();
        return refreshPromise;
      }
    }),
    {
      name: 'caseflow-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken })
    }
  )
);

setTokenProvider(() => authStore.getState().accessToken);
registerAuthHandlers({
  refreshSession: () => authStore.getState().refreshSession(),
  signOut: (options) => authStore.getState().signOut(options)
});
