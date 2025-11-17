import { apiClient } from './client';
export const listImports = (params) => {
    const search = new URLSearchParams();
    if (params.limit)
        search.set('limit', String(params.limit));
    if (params.cursor)
        search.set('cursor', params.cursor);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiClient.get(`/imports${suffix}`);
};
export const createImport = (payload) => apiClient.post('/imports', payload);
export const submitChunk = (importId, payload) => apiClient.post(`/imports/${importId}/chunks`, payload);
export const fetchImport = (importId) => apiClient.get(`/imports/${importId}`);
export const fetchImportErrors = (importId) => apiClient.get(`/imports/${importId}/errors`);
export const downloadImportErrorsCsv = async (importId) => {
    const response = await apiClient.download(`/imports/${importId}/errors.csv`, { method: 'GET' });
    return response.blob();
};
