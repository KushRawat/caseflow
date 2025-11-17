import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { importStore } from '../state/import.store';
const editableFields = [
    { id: 'priority', label: 'Priority', options: ['LOW', 'MEDIUM', 'HIGH'] },
    { id: 'category', label: 'Category', options: ['TAX', 'LICENSE', 'PERMIT'] }
];
export const BulkEditPanel = ({ disabled = false }) => {
    const selectedRowIds = importStore((state) => state.selectedRowIds);
    const setFieldValue = importStore((state) => state.setFieldValue);
    const clearSelection = importStore((state) => state.clearSelection);
    const mapping = importStore((state) => state.mapping);
    const [activeField, setActiveField] = useState('priority');
    const [value, setValue] = useState('LOW');
    const fieldMeta = useMemo(() => editableFields.find((field) => field.id === activeField), [activeField]);
    const handleApply = (scope) => {
        const targetRows = scope === 'selected' ? selectedRowIds : undefined;
        setFieldValue(fieldMeta.id, value, targetRows ? { rowIds: targetRows } : undefined);
    };
    const mappedField = mapping[activeField];
    return (_jsxs("section", { className: "surface-card", "aria-disabled": disabled, children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Bulk edit" }), _jsx("p", { className: "text-muted", children: "Update mapped fields for selected rows or the entire sheet." })] }), _jsxs("button", { type: "button", className: "ghost", onClick: clearSelection, disabled: selectedRowIds.length === 0 || disabled, children: ["Clear selection (", selectedRowIds.length, ")"] })] }), !mappedField && _jsxs("p", { className: "error-text", children: ["Map ", fieldMeta.label, " to a CSV column before editing."] }), _jsxs("div", { className: "bulk-edit-grid", children: [_jsxs("label", { className: "form-field", children: [_jsx("span", { children: "Field" }), _jsx("select", { value: activeField, onChange: (event) => setActiveField(event.target.value), disabled: disabled, children: editableFields.map((field) => (_jsx("option", { value: field.id, children: field.label }, field.id))) })] }), _jsxs("label", { className: "form-field", children: [_jsx("span", { children: "Value" }), _jsx("select", { value: value, onChange: (event) => setValue(event.target.value), disabled: disabled, children: fieldMeta.options.map((option) => (_jsx("option", { children: option }, option))) })] })] }), _jsxs("div", { className: "bulk-edit-actions", children: [_jsxs("button", { type: "button", className: "ghost", onClick: () => handleApply('selected'), disabled: selectedRowIds.length === 0 || !mappedField || disabled, children: ["Apply to ", selectedRowIds.length || 0, " selected rows"] }), _jsx("button", { type: "button", className: "primary", onClick: () => handleApply('all'), disabled: !mappedField || disabled, children: "Apply to entire column" })] })] }));
};
