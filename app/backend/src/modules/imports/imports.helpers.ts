import type { CaseRowInput } from '../cases/cases.validation.js';

import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const normalizePhone = (input?: string | null) => {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const digits = trimmed.replace(/\D/g, '');
  const attempts = [trimmed];
  if (!trimmed.startsWith('+') && digits) {
    attempts.push(`+${digits}`);
  }
  if (digits.length === 10) {
    attempts.push(`+91${digits}`);
    attempts.push(`+1${digits}`);
  }

  for (const candidate of attempts) {
    try {
      const parsed = parsePhoneNumberFromString(candidate);
      if (parsed && parsed.isValid()) {
        return parsed.format('E.164');
      }
    } catch {
      // try next candidate
    }
  }

  return undefined;
};

export const normalizeRow = (row: CaseRowInput): CaseRowInput => {
  const normalizedName = titleCase(row.applicantName.trim());
  const normalizedCaseId = row.caseId.trim();
  const normalizedEmail = row.email?.trim().toLowerCase();
  const normalizedPhone = normalizePhone(row.phone);

  return {
    ...row,
    caseId: normalizedCaseId,
    applicantName: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    priority: row.priority ?? 'LOW',
    status: row.status ?? 'NEW'
  };
};
