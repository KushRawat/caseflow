import { apiClient } from './client';
import type { CaseRowInput, ImportError, ImportJob, ImportListResponse, ImportReportPayload } from './types';

export type ChunkRow = {
  rowNumber: number;
  data: CaseRowInput;
  raw: Record<string, string>;
};

export type ChunkPayload = {
  chunkIndex: number;
  rows: ChunkRow[];
};

export const listImports = (params: { limit?: number; cursor?: string | null }) => {
  const search = new URLSearchParams();
  if (params.limit) search.set('limit', String(params.limit));
  if (params.cursor) search.set('cursor', params.cursor);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiClient.get<ImportListResponse>(`/imports${suffix}`);
};

export const createImport = (payload: { sourceName: string; totalRows: number }) =>
  apiClient.post<ImportJob>('/imports', payload);

export const submitChunk = (importId: string, payload: ChunkPayload) =>
  apiClient.post<{ successCount: number; failureCount: number; createdCount?: number; updatedCount?: number }>(
    `/imports/${importId}/chunks`,
    payload
  );

export const fetchImport = (importId: string) => apiClient.get<ImportReportPayload>(`/imports/${importId}`);

export const fetchImportErrors = (importId: string) =>
  apiClient.get<{ errors: ImportError[] }>(`/imports/${importId}/errors`);

export const downloadImportErrorsCsv = async (importId: string) => {
  const response = await apiClient.download(`/imports/${importId}/errors.csv`, { method: 'GET' });
  return response.blob();
};
