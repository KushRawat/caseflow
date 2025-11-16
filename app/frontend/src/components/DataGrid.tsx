import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import type { CsvRow } from '../state/import.store';
import type { SchemaFieldId, SchemaMapping } from '../utils/schema';

interface DataGridProps {
  rows: CsvRow[];
  headers: string[];
  columnOrder: string[];
  mapping: SchemaMapping;
  selectedRowIds: string[];
  onToggleRow: (rowId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (rowId: string, header: string, value: string) => void;
}

export const DataGrid = ({
  rows,
  headers,
  columnOrder,
  mapping,
  selectedRowIds,
  onToggleRow,
  onSelectAll,
  onEdit
}: DataGridProps) => {
  const orderedHeaders = columnOrder.length ? columnOrder : headers;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const allSelected = rows.length > 0 && selectedRowIds.length === rows.length;
  const selectionColumn: ColumnDef<CsvRow> = useMemo(
    () => ({
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          aria-label="Select all rows"
          checked={allSelected}
          ref={(input) => {
            if (input) input.indeterminate = selectedRowIds.length > 0 && !allSelected;
          }}
          onChange={(event) => onSelectAll(event.target.checked)}
        />
      ),
      cell: (info) => {
        const row = info.row.original;
        const selected = selectedRowIds.includes(row.id);
        return (
          <input
            type="checkbox"
            aria-label={`Select row ${row.rowNumber}`}
            checked={selected}
            onChange={() => onToggleRow(row.id)}
          />
        );
      },
      enableColumnFilter: false,
      size: 40
    }),
    [allSelected, onSelectAll, onToggleRow, selectedRowIds]
  );

  const dataColumns = useMemo<ColumnDef<CsvRow>[]>(
    () =>
      orderedHeaders.map((header) => ({
        accessorKey: header,
        header,
        cell: (info) => {
          const row = info.row.original;
          const value = row.values[header] ?? '';
          const fieldWithError = Object.entries(mapping).find(([, column]) => column === header)?.[0] as
            | SchemaFieldId
            | undefined;
          const hasError = fieldWithError ? Boolean(row.errors[fieldWithError]) : false;
          return (
            <div className="cell-wrapper">
              <input
                aria-label={`${header} row ${row.rowNumber}`}
                className={hasError ? 'cell-error' : ''}
                value={value}
                onChange={(event) => onEdit(row.id, header, event.target.value)}
              />
              {hasError && <span className="error-text">{row.errors[fieldWithError!]}</span>}
            </div>
          );
        },
        enableColumnFilter: true
      })),
    [mapping, onEdit, orderedHeaders]
  );

  const columns = useMemo<ColumnDef<CsvRow>[]>(() => [selectionColumn, ...dataColumns], [dataColumns, selectionColumn]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });
  const parentRef = useRef<HTMLDivElement>(null);
  const rowModel = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rowModel.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56
  });

  return (
    <div className="grid-scroll" ref={parentRef} role="grid" aria-rowcount={rowModel.rows.length} aria-multiselectable>
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} scope="col">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
          <tr>
            {table.getHeaderGroups()[0]?.headers.map((header) => (
              <th key={`${header.id}-filter`}>
                {header.column.getCanFilter() ? (
                  <input
                    aria-label={`Filter ${header.id}`}
                    placeholder="Filter"
                    value={(header.column.getFilterValue() as string) ?? ''}
                    onChange={(event) => header.column.setFilterValue(event.target.value)}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }} colSpan={columns.length}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rowModel.rows[virtualRow.index];
                return (
                  <table
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    role="presentation"
                  >
                    <tbody>
                      <tr>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                );
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
