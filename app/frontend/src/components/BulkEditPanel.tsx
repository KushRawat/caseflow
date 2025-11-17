import { useMemo, useState } from 'react';

import { importStore } from '../state/import.store';

const editableFields = [
  { id: 'priority', label: 'Priority', options: ['LOW', 'MEDIUM', 'HIGH'] },
  { id: 'category', label: 'Category', options: ['TAX', 'LICENSE', 'PERMIT'] }
] as const;

type EditableField = 'priority' | 'category';

type BulkEditPanelProps = {
  disabled?: boolean;
};

export const BulkEditPanel = ({ disabled = false }: BulkEditPanelProps) => {
  const selectedRowIds = importStore((state) => state.selectedRowIds);
  const setFieldValue = importStore((state) => state.setFieldValue);
  const clearSelection = importStore((state) => state.clearSelection);
  const mapping = importStore((state) => state.mapping);
  const [activeField, setActiveField] = useState<EditableField>('priority');
  const [value, setValue] = useState<string>('LOW');

  const fieldMeta = useMemo(() => editableFields.find((field) => field.id === activeField)!, [activeField]);

  const handleApply = (scope: 'selected' | 'all') => {
    const targetRows = scope === 'selected' ? selectedRowIds : undefined;
    setFieldValue(fieldMeta.id, value, targetRows ? { rowIds: targetRows } : undefined);
  };

  const mappedField = mapping[activeField];

  return (
    <section className="surface-card" aria-disabled={disabled}>
      <div className="section-title">
        <div>
          <h2>Bulk edit</h2>
          <p className="text-muted">Update mapped fields for selected rows or the entire sheet.</p>
        </div>
        <button type="button" className="ghost" onClick={clearSelection} disabled={selectedRowIds.length === 0 || disabled}>
          Clear selection ({selectedRowIds.length})
        </button>
      </div>
      {!mappedField && <p className="error-text">Map {fieldMeta.label} to a CSV column before editing.</p>}
      <div className="bulk-edit-grid">
        <label className="form-field">
          <span>Field</span>
          <select
            value={activeField}
            onChange={(event) => setActiveField(event.target.value as EditableField)}
            disabled={disabled}
          >
            {editableFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Value</span>
          <select value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled}>
            {fieldMeta.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="bulk-edit-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => handleApply('selected')}
          disabled={selectedRowIds.length === 0 || !mappedField || disabled}
        >
          Apply to {selectedRowIds.length || 0} selected rows
        </button>
        <button type="button" className="primary" onClick={() => handleApply('all')} disabled={!mappedField || disabled}>
          Apply to entire column
        </button>
      </div>
    </section>
  );
};
