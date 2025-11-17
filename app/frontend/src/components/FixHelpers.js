import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { fixers } from '../utils/fixers';
import { schemaFields } from '../utils/schema';
import { importStore } from '../state/import.store';
import { notifySuccess } from '../utils/toast';
export const FixHelpers = ({ disabled = false }) => {
    const applyFix = importStore((state) => state.applyFix);
    const selectedRowIds = importStore((state) => state.selectedRowIds);
    const [feedback, setFeedback] = useState(null);
    const recordAction = (message) => {
        setFeedback(message);
        notifySuccess(message);
    };
    const handleTrim = () => {
        schemaFields.forEach((field) => applyFix(field.id, fixers.trimAll));
        recordAction('Whitespace trimmed across every mapped column.');
    };
    const applyToSelected = (field, fixer, message) => {
        if (selectedRowIds.length === 0)
            return;
        applyFix(field, fixer, { rowIds: selectedRowIds });
        recordAction(message);
    };
    return (_jsxs("section", { className: "surface-card", "aria-labelledby": "fix-helpers", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { id: "fix-helpers", children: "Fix helpers" }), _jsx("p", { className: "text-muted", children: "Apply smart clean-up actions to every row or only what you selected." })] }), _jsxs("span", { className: "badge secondary", children: [selectedRowIds.length, " rows selected"] })] }), _jsxs("div", { className: "helper-actions", children: [_jsx("button", { type: "button", onClick: handleTrim, disabled: disabled, children: "Trim whitespace (all columns)" }), _jsx("button", { type: "button", onClick: () => {
                            applyFix('caseId', fixers.normalizeCaseId);
                            recordAction('Case IDs were normalized.');
                        }, disabled: disabled, children: "Normalize case IDs" }), _jsx("button", { type: "button", onClick: () => {
                            applyFix('applicantName', fixers.titleCase);
                            recordAction('Names converted to title case.');
                        }, disabled: disabled, children: "Title-case names" }), _jsx("button", { type: "button", onClick: () => {
                            applyFix('email', fixers.normalizeEmail);
                            recordAction('Emails lowercased.');
                        }, disabled: disabled, children: "Lowercase emails" }), _jsx("button", { type: "button", onClick: () => {
                            applyFix('phone', fixers.normalizePhone);
                            recordAction('Phone numbers normalized.');
                        }, disabled: disabled, children: "Normalize phone numbers" }), _jsx("button", { type: "button", onClick: () => applyToSelected('priority', fixers.defaultPriority, 'Priority set to LOW for selected rows.'), disabled: selectedRowIds.length === 0 || disabled, children: "Force LOW priority (selected)" })] }), feedback && _jsx("p", { className: "helper-feedback", children: feedback })] }));
};
