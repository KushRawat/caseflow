import { apiClient } from './client';
export const login = (payload) => apiClient.post('/auth/login', payload);
export const refresh = () => apiClient.post('/auth/refresh');
export const logout = (refreshToken) => apiClient.post('/auth/logout', { refreshToken });
export const me = () => apiClient.get('/auth/me');
export const registerUser = (payload) => apiClient.post('/auth/register', payload);
