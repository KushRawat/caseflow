import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fixers } from '../utils/fixers';
import { schemaFields } from '../utils/schema';
import { importStore } from '../state/import.store';
export const FixHelpers = () => {
    const applyFix = importStore((state) => state.applyFix);
    const handleTrim = () => {
        schemaFields.forEach((field) => applyFix(field.id, fixers.trimAll));
    };
    return (_jsxs("section", { className: "surface-card", "aria-labelledby": "fix-helpers", children: [_jsx("div", { className: "section-title", children: _jsxs("div", { children: [_jsx("h2", { id: "fix-helpers", children: "Fix helpers" }), _jsx("p", { className: "text-muted", children: "Apply smart clean-up actions to every row or column in one click." })] }) }), _jsxs("div", { className: "helper-actions", children: [_jsx("button", { type: "button", onClick: handleTrim, children: "Trim whitespace" }), _jsx("button", { type: "button", onClick: () => applyFix('applicantName', fixers.titleCase), children: "Title-case names" }), _jsx("button", { type: "button", onClick: () => applyFix('phone', fixers.normalizePhone), children: "Normalize phone numbers" })] })] }));
};
