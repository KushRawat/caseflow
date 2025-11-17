import { jsx as _jsx } from "react/jsx-runtime";
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BulkEditPanel } from '../BulkEditPanel';
import { importStore } from '../../state/import.store';
const loadSampleCsv = (overrides) => {
    importStore.getState().loadCsv({
        headers: overrides?.headers ?? ['case_id', 'priority', 'category'],
        rows: [
            { case_id: 'C-100', priority: 'LOW', category: 'TAX' },
            { case_id: 'C-200', priority: 'LOW', category: 'LICENSE' }
        ]
    });
};
describe('BulkEditPanel', () => {
    beforeEach(async () => {
        await act(async () => {
            importStore.getState().clear();
        });
    });
    afterEach(async () => {
        await act(async () => {
            importStore.getState().clear();
        });
    });
    it('prompts to map the selected field before editing', async () => {
        await act(async () => {
            loadSampleCsv({ headers: ['case_id', 'urgency'] });
            importStore.getState().setMapping('caseId', 'case_id');
        });
        render(_jsx(BulkEditPanel, {}));
        expect(screen.getByText(/Map Priority to a CSV column/i)).toBeVisible();
        expect(screen.getByRole('button', { name: /Apply to entire column/i })).toBeDisabled();
    });
    it('applies edits to selected rows and entire column', async () => {
        const user = userEvent.setup();
        await act(async () => {
            loadSampleCsv();
            importStore.getState().setMapping('caseId', 'case_id');
            importStore.getState().setMapping('priority', 'priority');
            const [firstRow] = importStore.getState().rows;
            importStore.getState().toggleRowSelection(firstRow.id);
        });
        render(_jsx(BulkEditPanel, {}));
        await act(async () => {
            await user.selectOptions(screen.getByLabelText('Value'), ['HIGH']);
        });
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /Apply to 1 selected rows/i }));
        });
        let [firstRow, secondRow] = importStore.getState().rows;
        expect(firstRow.values.priority).toBe('HIGH');
        expect(secondRow.values.priority).toBe('LOW');
        await act(async () => {
            await user.selectOptions(screen.getByLabelText('Value'), ['MEDIUM']);
        });
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /Apply to entire column/i }));
        });
        [firstRow, secondRow] = importStore.getState().rows;
        expect(firstRow.values.priority).toBe('MEDIUM');
        expect(secondRow.values.priority).toBe('MEDIUM');
    });
});
