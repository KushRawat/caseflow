import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const ColumnManager = ({ headers, columnOrder, onChange, disabled = false }) => {
    const [order, setOrder] = useState(columnOrder.length ? columnOrder : headers);
    useEffect(() => {
        setOrder(columnOrder.length ? columnOrder : headers);
    }, [columnOrder, headers]);
    const moveColumn = (index, delta) => {
        const next = [...order];
        const targetIndex = index + delta;
        if (targetIndex < 0 || targetIndex >= next.length)
            return;
        const [item] = next.splice(index, 1);
        next.splice(targetIndex, 0, item);
        setOrder(next);
        onChange(next);
    };
    const resetOrder = () => {
        setOrder(headers);
        onChange(headers);
    };
    return (_jsxs("section", { className: "surface-card", "aria-disabled": disabled, children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Column arrangement" }), _jsx("p", { className: "text-muted", children: "Reorder how columns appear in the review grid\u2014changes apply instantly and help during validation." })] }), _jsx("button", { type: "button", className: "ghost", onClick: resetOrder, disabled: disabled, children: "Reset" })] }), _jsx("div", { className: "column-grid", children: order.map((header, index) => (_jsxs("div", { className: "column-chip", children: [_jsx("span", { children: header }), _jsxs("div", { className: "chip-actions", children: [_jsx("button", { type: "button", onClick: () => moveColumn(index, -1), disabled: index === 0 || disabled, "aria-label": "Move column earlier", children: "\u2191" }), _jsx("button", { type: "button", onClick: () => moveColumn(index, 1), disabled: index === order.length - 1 || disabled, "aria-label": "Move column later", children: "\u2193" })] })] }, header))) })] }));
};
