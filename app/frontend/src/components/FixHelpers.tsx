import { useState } from 'react';

import { fixers } from '../utils/fixers';
import { schemaFields } from '../utils/schema';
import { importStore } from '../state/import.store';
import { notifySuccess } from '../utils/toast';

type FixHelpersProps = {
  disabled?: boolean;
};

export const FixHelpers = ({ disabled = false }: FixHelpersProps) => {
  const applyFix = importStore((state) => state.applyFix);
  const selectedRowIds = importStore((state) => state.selectedRowIds);
  const [feedback, setFeedback] = useState<string | null>(null);

  const recordAction = (message: string) => {
    setFeedback(message);
    notifySuccess(message);
  };

  const handleTrim = () => {
    schemaFields.forEach((field) => applyFix(field.id, fixers.trimAll));
    recordAction('Whitespace trimmed across every mapped column.');
  };

  const applyToSelected = (field: Parameters<typeof applyFix>[0], fixer: (value: string) => string, message: string) => {
    if (selectedRowIds.length === 0) return;
    applyFix(field, fixer, { rowIds: selectedRowIds });
    recordAction(message);
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
        <button type="button" onClick={handleTrim} disabled={disabled}>
          Trim whitespace (all columns)
        </button>
        <button
          type="button"
          onClick={() => {
            applyFix('caseId', fixers.normalizeCaseId);
            recordAction('Case IDs were normalized.');
          }}
          disabled={disabled}
        >
          Normalize case IDs
        </button>
        <button
          type="button"
          onClick={() => {
            applyFix('applicantName', fixers.titleCase);
            recordAction('Names converted to title case.');
          }}
          disabled={disabled}
        >
          Title-case names
        </button>
        <button
          type="button"
          onClick={() => {
            applyFix('email', fixers.normalizeEmail);
            recordAction('Emails lowercased.');
          }}
          disabled={disabled}
        >
          Lowercase emails
        </button>
        <button
          type="button"
          onClick={() => {
            applyFix('phone', fixers.normalizePhone);
            recordAction('Phone numbers normalized.');
          }}
          disabled={disabled}
        >
          Normalize phone numbers
        </button>
        <button
          type="button"
          onClick={() => applyToSelected('priority', fixers.defaultPriority, 'Priority set to LOW for selected rows.')}
          disabled={selectedRowIds.length === 0 || disabled}
        >
          Force LOW priority (selected)
        </button>
      </div>
      {feedback && <p className="helper-feedback">{feedback}</p>}
    </section>
  );
};
