import { apiClient } from './client';
import type { CaseDetail, CaseRecord, PaginatedResponse } from './types';

export const fetchCases = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiClient.get<PaginatedResponse<CaseRecord>>(`/cases${suffix}`);
};

export const fetchCase = (caseId: string) => apiClient.get<CaseDetail>(`/cases/${caseId}`);

export const updateCase = (caseId: string, payload: Record<string, unknown>) =>
  apiClient.patch<CaseRecord>(`/cases/${caseId}`, payload);

export const addCaseNote = (caseId: string, payload: { body: string }) =>
  apiClient.post(`/cases/${caseId}/notes`, payload);
