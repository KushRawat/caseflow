import { fixers } from '../utils/fixers';
import { schemaFields } from '../utils/schema';
import { importStore } from '../state/import.store';

export const FixHelpers = () => {
  const applyFix = importStore((state) => state.applyFix);
  const selectedRowIds = importStore((state) => state.selectedRowIds);

  const handleTrim = () => {
    schemaFields.forEach((field) => applyFix(field.id, fixers.trimAll));
  };

  const applyToSelected = (field: Parameters<typeof applyFix>[0], fixer: (value: string) => string) => {
    if (selectedRowIds.length === 0) return;
    applyFix(field, fixer, { rowIds: selectedRowIds });
  };

  return (
    <section className="surface-card" aria-labelledby="fix-helpers">
      <div className="section-title">
        <div>
          <h2 id="fix-helpers">Fix helpers</h2>
          <p className="text-muted">Apply smart clean-up actions to every row or only what you selected.</p>
        </div>
        <span className="badge secondary">{selectedRowIds.length} rows selected</span>
      </div>
      <div className="helper-actions">
        <button type="button" onClick={handleTrim}>
          Trim whitespace (all columns)
        </button>
        <button type="button" onClick={() => applyFix('caseId', fixers.normalizeCaseId)}>
          Normalize case IDs
        </button>
        <button type="button" onClick={() => applyFix('applicantName', fixers.titleCase)}>
          Title-case names
        </button>
        <button type="button" onClick={() => applyFix('email', fixers.normalizeEmail)}>
          Lowercase emails
        </button>
        <button type="button" onClick={() => applyFix('phone', fixers.normalizePhone)}>
          Normalize phone numbers
        </button>
        <button
          type="button"
          onClick={() => applyToSelected('priority', fixers.defaultPriority)}
          disabled={selectedRowIds.length === 0}
        >
          Force LOW priority (selected)
        </button>
      </div>
    </section>
  );
};
