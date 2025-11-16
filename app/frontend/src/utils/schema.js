export const schemaFields = [
    { id: 'caseId', label: 'Case ID', required: true, description: 'Unique identifier for the case.' },
    { id: 'applicantName', label: 'Applicant Name', required: true, description: 'Full legal name.' },
    { id: 'dob', label: 'Date of Birth', required: true, description: 'ISO format YYYY-MM-DD between 1900 and today.' },
    { id: 'email', label: 'Email', required: false, description: 'Valid email address.' },
    { id: 'phone', label: 'Phone', required: false, description: 'E.164 phone number.' },
    { id: 'category', label: 'Category', required: true, description: 'One of TAX, LICENSE, PERMIT.' },
    { id: 'priority', label: 'Priority', required: false, description: 'LOW (default), MEDIUM, HIGH.' }
];
const headerHints = {
    caseId: ['case id', 'case_id', 'caseid', 'id'],
    applicantName: ['applicant', 'name', 'applicant_name'],
    dob: ['dob', 'dateofbirth', 'date of birth'],
    email: ['email', 'mail'],
    phone: ['phone', 'mobile', 'contact'],
    category: ['category', 'type'],
    priority: ['priority', 'prio']
};
const normalizeHeader = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
export const detectSchemaMapping = (headers) => {
    const mapping = {};
    headers.forEach((header) => {
        const normalized = normalizeHeader(header);
        for (const field of schemaFields) {
            if (headerHints[field.id]?.some((hint) => normalized.includes(hint))) {
                if (!mapping[field.id]) {
                    mapping[field.id] = header;
                }
            }
        }
    });
    return mapping;
};
