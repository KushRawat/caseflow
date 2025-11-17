import { apiClient } from './client';
import type { CaseDetail, CaseRecord, CasesResponse } from './types';

type CaseQueryParams = {
  status?: string;
  category?: string;
  priority?: string;
  assigneeId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  cursor?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const fetchCases = (params: CaseQueryParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'cursor' && !value) return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient.get<CasesResponse>(`/cases${suffix}`);
};

export const fetchCase = (caseId: string) => apiClient.get<CaseDetail>(`/cases/${caseId}`);

export const updateCase = (caseId: string, payload: Record<string, unknown>) =>
  apiClient.patch<CaseRecord>(`/cases/${caseId}`, payload);

export const addCaseNote = (caseId: string, payload: { body: string }) =>
  apiClient.post(`/cases/${caseId}/notes`, payload);
