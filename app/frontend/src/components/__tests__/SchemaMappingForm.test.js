import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SchemaMappingForm } from '../SchemaMappingForm';
describe('SchemaMappingForm', () => {
    it('highlights missing required mappings', () => {
        render(_jsx(SchemaMappingForm, { mapping: { caseId: 'case_id' }, headers: ['case_id', 'applicant_name'], missingRequiredFields: ['applicantName', 'dob', 'category'], onChange: () => { } }));
        expect(screen.getByText('3 required fields missing')).toBeInTheDocument();
        const applicantSelect = screen.getByLabelText(/Applicant Name/i);
        expect(applicantSelect).toHaveAttribute('aria-invalid', 'true');
    });
});
