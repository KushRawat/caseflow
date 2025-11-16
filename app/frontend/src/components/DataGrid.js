import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
export const DataGrid = ({ rows, headers, mapping, onEdit }) => {
    const columns = useMemo(() => headers.map((header) => ({
        accessorKey: header,
        header,
        cell: (info) => {
            const row = info.row.original;
            const value = row.values[header] ?? '';
            const fieldWithError = Object.entries(mapping).find(([, column]) => column === header)?.[0];
            const hasError = fieldWithError ? Boolean(row.errors[fieldWithError]) : false;
            return (_jsxs("div", { className: "cell-wrapper", children: [_jsx("input", { "aria-label": `${header} row ${row.rowNumber}`, className: hasError ? 'cell-error' : '', value: value, onChange: (event) => onEdit(row.id, header, event.target.value) }), hasError && _jsx("span", { className: "error-text", children: row.errors[fieldWithError] })] }));
        }
    })), [headers, mapping, onEdit]);
    const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
    const parentRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: table.getRowModel().rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56
    });
    return (_jsx("div", { className: "grid-scroll", ref: parentRef, role: "table", "aria-rowcount": rows.length, children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: table.getHeaderGroups().map((headerGroup) => (_jsx("tr", { children: headerGroup.headers.map((header) => (_jsx("th", { scope: "col", children: flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, headerGroup.id))) }), _jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { style: { position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }, colSpan: headers.length, children: rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const row = table.getRowModel().rows[virtualRow.index];
                                return (_jsx("table", { style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`
                                    }, children: _jsx("tbody", { children: _jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }) }) }, row.id));
                            }) }) }) })] }) }));
};
