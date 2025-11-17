import { requestStore } from '../state/request.store';
import { notifyError, notifySuccess } from '../utils/toast';
const API_URL = import.meta.env.VITE_API_URL ?? '/api';
let tokenProvider;
let authHandlers = {};
export const setTokenProvider = (provider) => {
    tokenProvider = provider;
};
export const registerAuthHandlers = (handlers) => {
    authHandlers = handlers;
};
class ApiClient {
    buildHeaders(init) {
        const token = tokenProvider?.();
        const baseHeaders = init?.headers instanceof Headers
            ? Object.fromEntries(init.headers.entries())
            : (init?.headers ?? {});
        const headers = {
            'Content-Type': 'application/json',
            ...baseHeaders
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }
    async fetchWithAuth(path, init) {
        const headers = this.buildHeaders(init);
        return fetch(`${API_URL}${path}`, {
            ...init,
            headers,
            credentials: 'include'
        });
    }
    async parseError(response) {
        try {
            const body = (await response.json());
            return body.error ?? body.message ?? 'Request failed';
        }
        catch {
            return 'Request failed';
        }
    }
    async request(path, init, options) {
        const shouldRetryAuth = options?.retryOnAuthError ?? true;
        requestStore.getState().start();
        try {
            let response;
            try {
                response = await this.fetchWithAuth(path, init);
            }
            catch (networkError) {
                notifyError('Unable to reach the server. Please check your connection and try again.');
                throw networkError;
            }
            if (response.status === 401) {
                if (shouldRetryAuth && (await authHandlers.refreshSession?.())) {
                    return this.request(path, init, { retryOnAuthError: false });
                }
                const sessionMessage = 'Session expired. Please sign in again.';
                await authHandlers.signOut?.({ silent: true });
                notifyError(sessionMessage);
                throw new Error(sessionMessage);
            }
            if (response.status === 204) {
                notifySuccess('Completed');
                return {};
            }
            const body = await response.json().catch(() => ({ success: false }));
            if (!response.ok || !body.success) {
                const message = body.error ?? body.message ?? 'Request failed';
                notifyError(message);
                throw new Error(message);
            }
            const method = (init?.method ?? 'GET').toUpperCase();
            if (body.message && method !== 'GET') {
                notifySuccess(body.message);
            }
            return (body.data ?? {});
        }
        finally {
            requestStore.getState().stop();
        }
    }
    get(path) {
        return this.request(path, { method: 'GET' });
    }
    post(path, body) {
        return this.request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    }
    patch(path, body) {
        return this.request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
    }
    async download(path, init) {
        requestStore.getState().start();
        try {
            let response;
            try {
                response = await this.fetchWithAuth(path, init);
            }
            catch (networkError) {
                notifyError('Unable to reach the server. Please check your connection and try again.');
                throw networkError;
            }
            if (!response.ok) {
                const message = await this.parseError(response);
                notifyError(message);
                throw new Error(message);
            }
            return response;
        }
        finally {
            requestStore.getState().stop();
        }
    }
}
export const apiClient = new ApiClient();
