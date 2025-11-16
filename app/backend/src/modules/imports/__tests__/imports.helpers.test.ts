import { describe, expect, it } from 'vitest';

import { normalizeRow, normalizePhone, titleCase } from '../imports.helpers.js';

const baseRow = {
  caseId: ' C-123 ',
  applicantName: '  jOhn   doe ',
  dob: '1991-02-03',
  email: 'John@example.com',
  phone: '9876543210',
  category: 'TAX',
  priority: 'LOW',
  status: 'NEW'
} as const;

describe('imports helpers', () => {
  it('titleCase formats a string correctly', () => {
    expect(titleCase('john DOE')).toBe('John Doe');
  });

  it('normalizes phone numbers to E.164 when possible', () => {
    expect(normalizePhone('+1 (202) 555-0123')).toBe('+12025550123');
  });

  it('normalizes row shape for storage', () => {
    const normalized = normalizeRow(baseRow);
    expect(normalized.caseId).toBe('C-123');
    expect(normalized.applicantName).toBe('John Doe');
    expect(normalized.email).toBe('john@example.com');
  });
});
