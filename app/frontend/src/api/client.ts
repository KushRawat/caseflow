import { requestStore } from '../state/request.store';
import { notifyError, notifySuccess } from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
};

type TokenProvider = () => string | undefined;
let tokenProvider: TokenProvider | undefined;

type AuthHandlers = {
  refreshSession?: () => Promise<boolean>;
  signOut?: (options?: { silent?: boolean; message?: string }) => Promise<void>;
};

let authHandlers: AuthHandlers = {};

export const setTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider;
};

export const registerAuthHandlers = (handlers: AuthHandlers) => {
  authHandlers = handlers;
};

class ApiClient {
  private buildHeaders(init?: RequestInit) {
    const token = tokenProvider?.();
    const baseHeaders =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : ((init?.headers as Record<string, string>) ?? {});
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...baseHeaders
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private async fetchWithAuth(path: string, init?: RequestInit) {
    const headers = this.buildHeaders(init);
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include'
    });
  }

  private async parseError(response: Response) {
    try {
      const body = (await response.json()) as ApiEnvelope<unknown>;
      return body.error ?? body.message ?? 'Request failed';
    } catch {
      return 'Request failed';
    }
  }

  private async request<T>(path: string, init?: RequestInit, options?: { retryOnAuthError?: boolean }): Promise<T> {
    const shouldRetryAuth = options?.retryOnAuthError ?? true;
    requestStore.getState().start();
    try {
      let response: Response;
      try {
        response = await this.fetchWithAuth(path, init);
      } catch (networkError) {
        notifyError('Unable to reach the server. Please check your connection and try again.');
        throw networkError;
      }
      if (response.status === 401) {
        if (shouldRetryAuth && (await authHandlers.refreshSession?.())) {
          return this.request<T>(path, init, { retryOnAuthError: false });
        }
        const sessionMessage = 'Session expired. Please sign in again.';
        await authHandlers.signOut?.({ silent: true });
        notifyError(sessionMessage);
        throw new Error(sessionMessage);
      }
      if (response.status === 204) {
        notifySuccess('Completed');
        return {} as T;
      }

      const body: ApiEnvelope<T> = await response.json().catch(() => ({ success: false } as ApiEnvelope<T>));

      if (!response.ok || !body.success) {
        const message = body.error ?? body.message ?? 'Request failed';
        notifyError(message);
        throw new Error(message);
      }

      const method = (init?.method ?? 'GET').toUpperCase();
      if (body.message && method !== 'GET') {
        notifySuccess(body.message);
      }

      return (body.data ?? ({} as T)) as T;
    } finally {
      requestStore.getState().stop();
    }
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  async download(path: string, init?: RequestInit) {
    requestStore.getState().start();
    try {
      let response: Response;
      try {
        response = await this.fetchWithAuth(path, init);
      } catch (networkError) {
        notifyError('Unable to reach the server. Please check your connection and try again.');
        throw networkError;
      }
      if (!response.ok) {
        const message = await this.parseError(response);
        notifyError(message);
        throw new Error(message);
      }
      return response;
    } finally {
      requestStore.getState().stop();
    }
  }
}

export const apiClient = new ApiClient();
