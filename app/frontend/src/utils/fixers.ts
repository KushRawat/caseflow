const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizePhone = (input: string) => {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (input.startsWith('+')) {
    return input;
  }
  return `+${digits}`;
};

const normalizeCaseId = (value: string) => value.trim().toUpperCase();
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const fixers = {
  trimAll: (value: string) => value.trim(),
  titleCase: (value: string) => (value ? toTitleCase(value) : value),
  normalizePhone: (value: string) => (value ? normalizePhone(value) : value),
  normalizeCaseId: (value: string) => (value ? normalizeCaseId(value) : value),
  normalizeEmail: (value: string) => (value ? normalizeEmail(value) : value),
  defaultPriority: (value: string) => (value ? value.toUpperCase() : 'LOW')
};

export type FixerId = keyof typeof fixers;
