import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { schemaFields } from '../utils/schema';
export const SchemaMappingForm = ({ mapping, headers, missingRequiredFields, onChange, disabled = false }) => {
    const missingCount = missingRequiredFields.length;
    return (_jsxs("section", { className: "surface-card", "aria-labelledby": "mapping-heading", "aria-disabled": disabled, children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { id: "mapping-heading", children: "Schema mapping" }), _jsx("p", { className: "text-muted helper-note", children: "Tell CaseFlow which CSV header powers each field\u2014the mapping feeds validation, fixes, and bulk edits." })] }), _jsx("span", { className: `badge ${missingCount ? 'danger' : 'success'}`, "aria-live": "polite", children: missingCount ? `${missingCount} required field${missingCount > 1 ? 's' : ''} missing` : 'All required fields mapped' })] }), _jsx("div", { className: "mapping-grid", children: schemaFields.map((field) => {
                    const isMissing = field.required && !mapping[field.id];
                    return (_jsxs("label", { className: "mapping-row", "data-required": field.required, "data-missing": isMissing, children: [_jsxs("span", { children: [field.label, field.required && _jsx("span", { "aria-hidden": "true", children: "*" })] }), _jsxs("select", { value: mapping[field.id] ?? '', "aria-invalid": isMissing, disabled: disabled, onChange: (event) => onChange(field.id, event.target.value), children: [_jsx("option", { value: "", children: "Select column" }), headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] }), _jsx("small", { children: field.description })] }, field.id));
                }) })] }));
};
