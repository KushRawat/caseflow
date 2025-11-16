import { toast } from 'react-hot-toast';

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

export const setTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider;
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

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(path, init);

    if (response.status === 204) {
      toast.success('Completed');
      return {} as T;
    }

    const body: ApiEnvelope<T> = await response.json().catch(() => ({ success: false } as ApiEnvelope<T>));

    if (!response.ok || !body.success) {
      const message = body.error ?? body.message ?? 'Request failed';
      toast.error(message);
      throw new Error(message);
    }

    if (body.message) {
      toast.success(body.message);
    }

    return (body.data ?? ({} as T)) as T;
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
    const response = await this.fetchWithAuth(path, init);
    if (!response.ok) {
      const message = await this.parseError(response);
      toast.error(message);
      throw new Error(message);
    }
    return response;
  }
}

export const apiClient = new ApiClient();
