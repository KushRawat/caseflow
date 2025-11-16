import { describe, expect, it } from 'vitest';

import { caseRowSchema } from '../cases.validation.js';

const baseRow = {
  caseId: 'C-1',
  applicantName: 'Jane Doe',
  dob: '1990-01-01',
  email: 'jane@example.com',
  phone: '+15551234567',
  category: 'TAX',
  priority: 'LOW',
  status: 'NEW'
} as const;

describe('caseRowSchema', () => {
  it('accepts a valid row', () => {
    const result = caseRowSchema.parse(baseRow);
    expect(result.caseId).toBe('C-1');
  });

  it('rejects missing required fields', () => {
    expect(() =>
      caseRowSchema.parse({
        ...baseRow,
        applicantName: ''
      })
    ).toThrowError();
  });

  it('rejects out of range dates', () => {
    expect(() =>
      caseRowSchema.parse({
        ...baseRow,
        dob: '1899-01-01'
      })
    ).toThrowError();
  });
});
