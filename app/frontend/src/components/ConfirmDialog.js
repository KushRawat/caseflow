import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ConfirmDialog = ({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
    if (!open)
        return null;
    return (_jsx("div", { className: "confirm-modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirm-title", children: _jsxs("div", { className: "confirm-modal", children: [_jsx("h2", { id: "confirm-title", children: title }), description && _jsx("div", { className: "confirm-body", children: description }), _jsxs("div", { className: "confirm-actions", children: [_jsx("button", { type: "button", className: "ghost", onClick: onCancel, children: cancelLabel }), _jsx("button", { type: "button", className: "primary", onClick: onConfirm, children: confirmLabel })] })] }) }));
};
