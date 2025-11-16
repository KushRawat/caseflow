import { apiClient } from './client';
import type { ImportError, ImportJob, PaginatedResponse } from './types';

export const listImports = (params: { cursor?: string; limit?: number }) => {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiClient.get<PaginatedResponse<ImportJob>>(`/imports${suffix}`);
};

export const createImport = (payload: { sourceName: string; totalRows: number }) =>
  apiClient.post<ImportJob>('/imports', payload);

export const submitChunk = (importId: string, payload: { chunkIndex: number; rows: unknown[] }) =>
  apiClient.post<{ successCount: number; failureCount: number }>(`/imports/${importId}/chunks`, payload);

export const fetchImport = (importId: string) => apiClient.get<ImportJob & { errors: ImportError[] }>(`/imports/${importId}`);

export const fetchImportErrors = (importId: string) =>
  apiClient.get<{ errors: ImportError[] }>(`/imports/${importId}/errors`);

export const downloadImportErrorsCsv = async (importId: string) => {
  const response = await apiClient.download(`/imports/${importId}/errors.csv`, { method: 'GET' });
  return response.blob();
};
