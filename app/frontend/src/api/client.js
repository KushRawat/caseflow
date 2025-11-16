import { toast } from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL ?? '/api';
let tokenProvider;
export const setTokenProvider = (provider) => {
    tokenProvider = provider;
};
class ApiClient {
    async request(path, init) {
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
        const response = await fetch(`${API_URL}${path}`, {
            ...init,
            headers,
            credentials: 'include'
        });
        if (response.status === 204) {
            toast.success('Completed');
            return {};
        }
        const body = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !body.success) {
            const message = body.error ?? body.message ?? 'Request failed';
            toast.error(message);
            throw new Error(message);
        }
        if (body.message) {
            toast.success(body.message);
        }
        return (body.data ?? {});
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
}
export const apiClient = new ApiClient();
