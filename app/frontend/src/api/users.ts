import { apiClient } from './client';
import type { User } from './types';

export const listUsers = () => apiClient.get<{ users: Pick<User, 'id' | 'email' | 'role'>[] }>('/users');
