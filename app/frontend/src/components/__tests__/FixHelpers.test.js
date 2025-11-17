import { jsx as _jsx } from "react/jsx-runtime";
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, afterEach } from 'vitest';
import { FixHelpers } from '../FixHelpers';
import { importStore } from '../../state/import.store';
describe('FixHelpers component', () => {
    afterEach(async () => {
        await act(async () => {
            importStore.getState().clear();
        });
    });
    it('trims whitespace across all mapped columns', async () => {
        const user = userEvent.setup();
        await act(async () => {
            importStore.getState().loadCsv({
                headers: ['case_id', 'applicant_name', 'priority'],
                rows: [
                    { case_id: '  C-0001  ', applicant_name: '  jane  doe ', priority: '  high ' }
                ]
            });
            importStore.getState().setMapping('caseId', 'case_id');
            importStore.getState().setMapping('applicantName', 'applicant_name');
            importStore.getState().setMapping('priority', 'priority');
        });
        render(_jsx(FixHelpers, {}));
        await act(async () => {
            await user.click(screen.getByRole('button', { name: /trim whitespace/i }));
        });
        const row = importStore.getState().rows[0];
        expect(row.values.case_id).toBe('C-0001');
        expect(row.values.applicant_name).toBe('jane  doe');
        expect(row.values.priority).toBe('high');
    });
});
