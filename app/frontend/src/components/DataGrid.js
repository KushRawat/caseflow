import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
export const DataGrid = ({ rows, headers, columnOrder, mapping, selectedRowIds, onToggleRow, onSelectAll, onEdit, readOnly = false }) => {
    const orderedHeaders = columnOrder.length ? columnOrder : headers;
    const [columnFilters, setColumnFilters] = useState([]);
    const allSelected = rows.length > 0 && selectedRowIds.length === rows.length;
    const selectionColumn = useMemo(() => ({
        id: 'select',
        header: () => (_jsx("input", { type: "checkbox", "aria-label": "Select all rows", checked: allSelected, ref: (input) => {
                if (input)
                    input.indeterminate = selectedRowIds.length > 0 && !allSelected;
            }, disabled: readOnly, onChange: (event) => onSelectAll(event.target.checked) })),
        cell: (info) => {
            const row = info.row.original;
            const selected = selectedRowIds.includes(row.id);
            return (_jsx("input", { type: "checkbox", "aria-label": `Select row ${row.rowNumber}`, checked: selected, disabled: readOnly, onChange: () => onToggleRow(row.id) }));
        },
        enableColumnFilter: false,
        size: 40
    }), [allSelected, onSelectAll, onToggleRow, selectedRowIds]);
    const dataColumns = useMemo(() => orderedHeaders.map((header) => ({
        accessorKey: header,
        header,
        cell: (info) => {
            const row = info.row.original;
            const value = row.values[header] ?? '';
            const fieldWithError = Object.entries(mapping).find(([, column]) => column === header)?.[0];
            const hasError = fieldWithError ? Boolean(row.errors[fieldWithError]) : false;
            return (_jsxs("div", { className: "cell-wrapper", children: [_jsx("input", { "aria-label": `${header} row ${row.rowNumber}`, className: hasError ? 'cell-error' : '', value: value, disabled: readOnly, onChange: (event) => onEdit(row.id, header, event.target.value) }), hasError && _jsx("span", { className: "error-text", children: row.errors[fieldWithError] })] }));
        },
        enableColumnFilter: true
    })), [mapping, onEdit, orderedHeaders]);
    const columns = useMemo(() => [selectionColumn, ...dataColumns], [dataColumns, selectionColumn]);
    const table = useReactTable({
        data: rows,
        columns,
        state: { columnFilters },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel()
    });
    const parentRef = useRef(null);
    const rowModel = table.getRowModel();
    const rowVirtualizer = useVirtualizer({
        count: rowModel.rows.length,
        getScrollElement: () => parentRef.current,
        getItemKey: (index) => rowModel.rows[index]?.id ?? index,
        estimateSize: () => 80,
        measureElement: (element) => element?.getBoundingClientRect().height ?? 0
    });
    return (_jsx("div", { className: `grid-scroll virtualized${readOnly ? ' read-only' : ''}`, ref: parentRef, role: "grid", "aria-rowcount": rowModel.rows.length, "aria-multiselectable": true, "aria-readonly": readOnly, children: _jsxs("table", { className: "table", children: [_jsxs("thead", { children: [table.getHeaderGroups().map((headerGroup) => (_jsx("tr", { children: headerGroup.headers.map((header) => (_jsx("th", { scope: "col", children: flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, headerGroup.id))), _jsx("tr", { children: table.getHeaderGroups()[0]?.headers.map((header) => (_jsx("th", { children: header.column.getCanFilter() ? (_jsx("input", { "aria-label": `Filter ${header.id}`, placeholder: "Filter", value: header.column.getFilterValue() ?? '', disabled: readOnly, onChange: (event) => header.column.setFilterValue(event.target.value) })) : null }, `${header.id}-filter`))) })] }), _jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { style: { position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }, colSpan: columns.length, children: rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const row = rowModel.rows[virtualRow.index];
                                if (!row)
                                    return null;
                                return (_jsx("table", { ref: (element) => {
                                        if (element) {
                                            rowVirtualizer.measureElement(element);
                                        }
                                    }, style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`
                                    }, role: "presentation", children: _jsx("tbody", { children: _jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }) }) }, row.id));
                            }) }) }) })] }) }));
};
