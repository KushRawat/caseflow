import { create } from 'zustand';

import type { CaseRowInput } from '../api/types';
import { detectSchemaMapping, type SchemaFieldId, type SchemaMapping } from '../utils/schema';
import type { RowValidationResult } from '../utils/validators';
import { validateRow } from '../utils/validators';

export type CsvRow = {
  id: string;
  rowNumber: number;
  values: Record<string, string>;
  errors: Partial<Record<SchemaFieldId, string>>;
  normalized?: CaseRowInput;
};

type ImportState = {
  headers: string[];
  columnOrder: string[];
  rows: CsvRow[];
  mapping: SchemaMapping;
  status: 'idle' | 'ready' | 'validating' | 'validated';
  validationSummary?: { valid: number; invalid: number };
  currentImportId?: string;
  submitProgress?: {
    total: number;
    processed: number;
    success: number;
    failure: number;
    failedChunks: number[];
    status: 'idle' | 'uploading' | 'done' | 'cancelled';
    created: number;
    updated: number;
    lastError?: string;
  };
  sourceName?: string;
  selectedRowIds: string[];
};

type ImportStore = ImportState & {
  loadCsv: (payload: { headers: string[]; rows: Record<string, string>[]; sourceName?: string }) => void;
  setMapping: (field: SchemaFieldId, header: string) => void;
  updateCell: (rowId: string, header: string, value: string) => void;
  applyFix: (field: SchemaFieldId, transform: (value: string) => string, options?: { rowIds?: string[] }) => void;
  setFieldValue: (field: SchemaFieldId, value: string, options?: { rowIds?: string[] }) => void;
  validate: () => void;
  setImportId: (id: string) => void;
  setSubmitProgress: (progress: ImportState['submitProgress']) => void;
  setColumnOrder: (order: string[]) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAllRows: (selected: boolean) => void;
  clearSelection: () => void;
  revalidateRow: (rowId: string) => void;
  clear: () => void;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const createRow = (values: Record<string, string>, index: number): CsvRow => ({
  id: generateId(),
  rowNumber: index + 2, // account for header row in CSV
  values,
  errors: {}
});

const summarizeRows = (rows: CsvRow[]) => {
  const valid = rows.filter((row) => Object.keys(row.errors).length === 0).length;
  return { valid, invalid: rows.length - valid };
};

const buildCaseIdSet = (rows: CsvRow[], mapping: SchemaMapping, excludeRowId?: string) => {
  const caseHeader = mapping.caseId;
  const seen = new Set<string>();
  if (!caseHeader) return seen;
  for (const row of rows) {
    if (row.id === excludeRowId) continue;
    const rawValue = row.values[caseHeader];
    if (rawValue === undefined || rawValue === null) continue;
    const trimmed = rawValue.toString().trim();
    if (trimmed) {
      seen.add(trimmed);
    }
  }
  return seen;
};

export const importStore = create<ImportStore>((set, get) => ({
  headers: [],
  columnOrder: [],
  rows: [],
  mapping: {},
  status: 'idle',
  selectedRowIds: [],
  loadCsv({ headers, rows, sourceName }) {
    set({
      headers,
      columnOrder: headers,
      rows: rows.map((row, index) => createRow(row, index)),
      mapping: detectSchemaMapping(headers),
      status: 'ready',
      validationSummary: undefined,
      sourceName,
      selectedRowIds: []
    });
  },
  setMapping(field, header) {
    set((state) => {
      const next: SchemaMapping = { ...state.mapping };
      if (!header) {
        delete next[field];
      } else {
        next[field] = header;
      }
      return { mapping: next };
    });
  },
  updateCell(rowId, header, value) {
    set((state) => ({
      rows: state.rows.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [header]: value } } : row)),
      status: 'ready',
      validationSummary: undefined,
      submitProgress: undefined
    }));
    get().revalidateRow(rowId);
  },
  applyFix(field, transform, options) {
    const header = get().mapping[field];
    if (!header) return;
    const targetRowIds = options?.rowIds;
    set((state) => ({
      rows: state.rows.map((row) => ({
        ...row,
        values: {
          ...row.values,
          [header]:
            targetRowIds && !targetRowIds.includes(row.id)
              ? row.values[header]
              : transform((row.values[header] ?? '').toString())
        }
      })),
      status: 'ready',
      validationSummary: undefined,
      submitProgress: undefined
    }));
    if (targetRowIds && targetRowIds.length > 0) {
      targetRowIds.forEach((rowId) => get().revalidateRow(rowId));
    }
  },
  setFieldValue(field, value, options) {
    const header = get().mapping[field];
    if (!header) return;
    const targetRowIds = options?.rowIds;
    set((state) => ({
      rows: state.rows.map((row) => ({
        ...row,
        values: {
          ...row.values,
          [header]: targetRowIds && !targetRowIds.includes(row.id) ? row.values[header] : value
        }
      })),
      status: 'ready',
      validationSummary: undefined,
      submitProgress: undefined
    }));
    if (targetRowIds && targetRowIds.length > 0) {
      targetRowIds.forEach((rowId) => get().revalidateRow(rowId));
    }
  },
  validate() {
    const state = get();
    const seenCaseIds = new Set<string>();
    const updatedRows: CsvRow[] = state.rows.map((row) => {
      const result: RowValidationResult = validateRow(row.values, state.mapping, seenCaseIds);
      return { ...row, errors: result.errors, normalized: result.normalized };
    });

    set({
      rows: updatedRows,
      status: 'validated',
      validationSummary: summarizeRows(updatedRows)
    });
  },
  setImportId(id) {
    set({ currentImportId: id });
  },
  setSubmitProgress(progress) {
    set({ submitProgress: progress });
  },
  setColumnOrder(order) {
    set({ columnOrder: order });
  },
  toggleRowSelection(rowId) {
    set((state) => {
      const setSelected = new Set(state.selectedRowIds);
      if (setSelected.has(rowId)) {
        setSelected.delete(rowId);
      } else {
        setSelected.add(rowId);
      }
      return { selectedRowIds: Array.from(setSelected) };
    });
  },
  selectAllRows(selected) {
    set((state) => ({
      selectedRowIds: selected ? state.rows.map((row) => row.id) : []
    }));
  },
  clearSelection() {
    set({ selectedRowIds: [] });
  },
  revalidateRow(rowId) {
    const state = get();
    const target = state.rows.find((row) => row.id === rowId);
    if (!target) return;
    const seenCaseIds = buildCaseIdSet(state.rows, state.mapping, rowId);
    const result: RowValidationResult = validateRow(target.values, state.mapping, seenCaseIds);
    set((current) => {
      const nextRows = current.rows.map((row) =>
        row.id === rowId ? { ...row, errors: result.errors, normalized: result.normalized } : row
      );
      return {
        rows: nextRows,
        validationSummary: summarizeRows(nextRows)
      };
    });
  },
  clear() {
    set({
      headers: [],
      columnOrder: [],
      rows: [],
      mapping: {},
      status: 'idle',
      currentImportId: undefined,
      validationSummary: undefined,
      sourceName: undefined,
      submitProgress: undefined,
      selectedRowIds: []
    });
  }
}));

export const selectGridData = () => importStore.getState().rows;
export const selectValidRows = () =>
  importStore
    .getState()
    .rows.filter((row) => Object.keys(row.errors).length === 0 && row.normalized) as (CsvRow & { normalized: CaseRowInput })[];
