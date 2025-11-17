const toTitleCase = (value) => value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
const normalizePhone = (input) => {
    const digits = input.replace(/\D/g, '');
    if (!digits)
        return '';
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    if (input.startsWith('+')) {
        return input;
    }
    return `+${digits}`;
};
const normalizeCaseId = (value) => value.trim().toUpperCase();
const normalizeEmail = (value) => value.trim().toLowerCase();
export const fixers = {
    trimAll: (value) => value.trim(),
    titleCase: (value) => (value ? toTitleCase(value) : value),
    normalizePhone: (value) => (value ? normalizePhone(value) : value),
    normalizeCaseId: (value) => (value ? normalizeCaseId(value) : value),
    normalizeEmail: (value) => (value ? normalizeEmail(value) : value),
    defaultPriority: (value) => (value ? value.toUpperCase() : 'LOW')
};
