import { create } from 'zustand';
import { detectSchemaMapping } from '../utils/schema';
import { validateRow } from '../utils/validators';
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
};
const createRow = (values, index) => ({
    id: generateId(),
    rowNumber: index + 2, // account for header row in CSV
    values,
    errors: {}
});
export const importStore = create((set, get) => ({
    headers: [],
    rows: [],
    mapping: {},
    status: 'idle',
    loadCsv({ headers, rows, sourceName }) {
        set({
            headers,
            rows: rows.map((row, index) => createRow(row, index)),
            mapping: detectSchemaMapping(headers),
            status: 'ready',
            validationSummary: undefined,
            sourceName
        });
    },
    setMapping(field, header) {
        set((state) => {
            const next = { ...state.mapping };
            if (!header) {
                delete next[field];
            }
            else {
                next[field] = header;
            }
            return { mapping: next };
        });
    },
    updateCell(rowId, header, value) {
        set((state) => ({
            rows: state.rows.map((row) => (row.id === rowId ? { ...row, values: { ...row.values, [header]: value } } : row))
        }));
    },
    applyFix(field, transform) {
        const header = get().mapping[field];
        if (!header)
            return;
        set((state) => ({
            rows: state.rows.map((row) => ({
                ...row,
                values: {
                    ...row.values,
                    [header]: transform(row.values[header] ?? '')
                }
            }))
        }));
    },
    validate() {
        const state = get();
        const seenCaseIds = new Set();
        const updatedRows = state.rows.map((row) => {
            const result = validateRow(row.values, state.mapping, seenCaseIds);
            return { ...row, errors: result.errors, normalized: result.normalized };
        });
        const valid = updatedRows.filter((row) => Object.keys(row.errors).length === 0).length;
        const invalid = updatedRows.length - valid;
        set({
            rows: updatedRows,
            status: 'validated',
            validationSummary: { valid, invalid }
        });
    },
    setImportId(id) {
        set({ currentImportId: id });
    },
    setSubmitProgress(progress) {
        set({ submitProgress: progress });
    },
    clear() {
        set({
            headers: [],
            rows: [],
            mapping: {},
            status: 'idle',
            currentImportId: undefined,
            validationSummary: undefined,
            sourceName: undefined,
            submitProgress: undefined
        });
    }
}));
export const selectGridData = () => importStore.getState().rows;
export const selectValidRows = () => importStore
    .getState()
    .rows.filter((row) => Object.keys(row.errors).length === 0 && row.normalized);
