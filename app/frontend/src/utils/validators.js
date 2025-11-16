const MIN_DATE = new Date('1900-01-01');
const isValidDate = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= MIN_DATE && date <= new Date();
};
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;
const categories = new Set(['TAX', 'LICENSE', 'PERMIT']);
const priorities = new Set(['LOW', 'MEDIUM', 'HIGH']);
export const validateRow = (row, mapping, seenCaseIds) => {
    const errors = {};
    const readField = (field) => {
        const header = mapping[field];
        if (!header)
            return '';
        return row[header]?.toString()?.trim() ?? '';
    };
    const caseId = readField('caseId');
    if (!caseId) {
        errors.caseId = 'Case ID is required';
    }
    else if (seenCaseIds.has(caseId)) {
        errors.caseId = 'Case ID appears multiple times in the file';
    }
    else {
        seenCaseIds.add(caseId);
    }
    const applicantName = readField('applicantName');
    if (!applicantName)
        errors.applicantName = 'Applicant name is required';
    const dob = readField('dob');
    if (!dob)
        errors.dob = 'Date of birth is required';
    else if (!isValidDate(dob))
        errors.dob = 'Date must be between 1900 and today';
    const email = readField('email');
    if (email && !emailRegex.test(email))
        errors.email = 'Email is invalid';
    const phone = readField('phone');
    if (phone && !phoneRegex.test(phone.replace(/\s|-/g, ''))) {
        errors.phone = 'Phone must be in E.164 format';
    }
    const category = readField('category').toUpperCase();
    if (!category)
        errors.category = 'Category required';
    else if (!categories.has(category))
        errors.category = 'Category must be TAX, LICENSE, or PERMIT';
    let priority = readField('priority').toUpperCase();
    if (!priority)
        priority = 'LOW';
    if (!priorities.has(priority)) {
        errors.priority = 'Priority must be LOW, MEDIUM, or HIGH';
    }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }
    const normalized = {
        caseId,
        applicantName,
        dob,
        email: email || undefined,
        phone: phone || undefined,
        category: category,
        priority: priority ?? 'LOW',
        status: 'NEW'
    };
    return { errors, normalized };
};
