import { apiClient } from './client';
import type { Role, User } from './types';

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export const login = (payload: { email: string; password: string }) =>
  apiClient.post<AuthResponse>('/auth/login', payload);

export const refresh = (refreshToken?: string) =>
  apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });

export const logout = (refreshToken?: string) => apiClient.post<void>('/auth/logout', { refreshToken });

export const me = () => apiClient.get<{ user: User }>('/auth/me');

export const registerUser = (payload: { email: string; password: string; role: Role }) =>
  apiClient.post<{ user: User }>('/auth/register', payload);
