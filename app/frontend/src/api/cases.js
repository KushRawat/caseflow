import { apiClient } from './client';
export const fetchCases = (params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/cases${suffix}`);
};
export const fetchCase = (caseId) => apiClient.get(`/cases/${caseId}`);
export const updateCase = (caseId, payload) => apiClient.patch(`/cases/${caseId}`, payload);
export const addCaseNote = (caseId, payload) => apiClient.post(`/cases/${caseId}/notes`, payload);
