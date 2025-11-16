import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

import { login as loginApi, logout as logoutApi, me, refresh } from '../api/auth';
import { setTokenProvider } from '../api/client';
import type { User } from '../api/types';

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
  signOut: () => Promise<void>;
};

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

        try {
          const refreshed = await refresh();
          const profile = await me();
          set({
            status: 'authenticated',
            user: profile.user,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken
          });
        } catch {
          set({ status: 'idle', user: undefined, accessToken: undefined, refreshToken: undefined });
        }
      },
      async signOut() {
        const token = get().refreshToken;
        try {
          await logoutApi(token);
          toast.success('Signed out');
        } catch (error) {
          toast.error((error as Error).message ?? 'Unable to sign out');
        } finally {
          set({ user: undefined, accessToken: undefined, refreshToken: undefined, status: 'idle' });
        }
      }
    }),
    {
      name: 'caseflow-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken })
    }
  )
);

setTokenProvider(() => authStore.getState().accessToken);
