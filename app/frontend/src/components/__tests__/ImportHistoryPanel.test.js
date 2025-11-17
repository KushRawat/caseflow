import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi, beforeEach, beforeAll, afterAll } from 'vitest';
vi.mock('../../api/imports', () => ({
    listImports: vi.fn().mockResolvedValue({
        imports: [
            {
                id: 'import-1',
                sourceName: 'sample.csv',
                status: 'COMPLETED',
                successCount: 10,
                failureCount: 0,
                totalRows: 10,
                createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
                completedAt: new Date('2024-01-01T00:05:00Z').toISOString(),
                createdBy: { id: 'user-1', email: 'ops@example.com' }
            }
        ],
        pageSize: 10,
        total: 1,
        hasNext: false,
        nextCursor: null
    }),
    downloadImportErrorsCsv: vi.fn().mockResolvedValue(new Blob())
}));
import { downloadImportErrorsCsv } from '../../api/imports';
import i18n from '../../i18n';
import { ImportHistoryPanel } from '../ImportHistoryPanel';
const objectUrlMock = vi.fn(() => 'blob:mock');
const revokeObjectUrlMock = vi.fn();
const anchorClickMock = vi.fn();
let originalAnchorClick;
let createObjectUrlSpy;
let revokeObjectUrlSpy;
const ensureUrlHelpers = () => {
    if (typeof globalThis.URL.createObjectURL !== 'function') {
        Object.defineProperty(globalThis.URL, 'createObjectURL', {
            configurable: true,
            value: () => 'mock-url'
        });
    }
    if (typeof globalThis.URL.revokeObjectURL !== 'function') {
        Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
            configurable: true,
            value: () => { }
        });
    }
};
beforeAll(() => {
    ensureUrlHelpers();
    createObjectUrlSpy = vi.spyOn(globalThis.URL, 'createObjectURL').mockImplementation(objectUrlMock);
    revokeObjectUrlSpy = vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(revokeObjectUrlMock);
    originalAnchorClick = HTMLAnchorElement.prototype.click;
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
        configurable: true,
        value: anchorClickMock
    });
});
afterAll(() => {
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
        configurable: true,
        value: originalAnchorClick
    });
});
const createClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false
        }
    }
});
describe('ImportHistoryPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        objectUrlMock.mockClear();
        revokeObjectUrlMock.mockClear();
        anchorClickMock.mockClear();
    });
    it('renders recent import rows and allows selection', async () => {
        const onSelect = vi.fn();
        const client = createClient();
        render(_jsx(I18nextProvider, { i18n: i18n, children: _jsx(QueryClientProvider, { client: client, children: _jsx(ImportHistoryPanel, { onSelectReport: onSelect }) }) }));
        await screen.findByText('sample.csv');
        expect(screen.getByText('ops@example.com')).toBeVisible();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /view report/i }));
        expect(onSelect).toHaveBeenCalledWith('import-1');
    });
    it('downloads error CSV for an import', async () => {
        const client = createClient();
        render(_jsx(I18nextProvider, { i18n: i18n, children: _jsx(QueryClientProvider, { client: client, children: _jsx(ImportHistoryPanel, { onSelectReport: () => { } }) }) }));
        await screen.findByText('sample.csv');
        const user = userEvent.setup();
        await act(async () => {
            await user.click(screen.getAllByRole('button', { name: /download csv/i })[0]);
        });
        await waitFor(() => {
            expect(downloadImportErrorsCsv).toHaveBeenCalledWith('import-1');
        });
    });
});
