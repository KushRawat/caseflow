import { expect, it } from 'vitest';
import { importStore } from './import.store';
it('validates CSV rows', () => {
    importStore.getState().loadCsv({
        headers: ['case_id', 'applicant_name', 'dob', 'category'],
        rows: [
            { case_id: 'C-1', applicant_name: 'Sam', dob: '1995-01-01', category: 'TAX' },
            { case_id: '', applicant_name: '', dob: '1890-01-01', category: 'BAD' }
        ]
    });
    importStore.getState().setMapping('caseId', 'case_id');
    importStore.getState().setMapping('applicantName', 'applicant_name');
    importStore.getState().setMapping('dob', 'dob');
    importStore.getState().setMapping('category', 'category');
    importStore.getState().validate();
    const rows = importStore.getState().rows;
    expect(rows[0].errors).toEqual({});
    expect(rows[1].errors.caseId).toBeTruthy();
    importStore.getState().clear();
});
