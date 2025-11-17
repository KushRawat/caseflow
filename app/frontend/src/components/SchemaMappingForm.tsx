import type { SchemaFieldId, SchemaMapping } from '../utils/schema';
import { schemaFields } from '../utils/schema';

interface SchemaMappingFormProps {
  mapping: SchemaMapping;
  headers: string[];
  missingRequiredFields: SchemaFieldId[];
  onChange: (field: SchemaFieldId, header: string) => void;
  disabled?: boolean;
}

export const SchemaMappingForm = ({ mapping, headers, missingRequiredFields, onChange, disabled = false }: SchemaMappingFormProps) => {
  const missingCount = missingRequiredFields.length;
  return (
    <section className="surface-card" aria-labelledby="mapping-heading" aria-disabled={disabled}>
      <div className="section-title">
        <div>
          <h2 id="mapping-heading">Schema mapping</h2>
          <p className="text-muted helper-note">
            Tell CaseFlow which CSV header powers each field—the mapping feeds validation, fixes, and bulk edits.
          </p>
        </div>
        <span className={`badge ${missingCount ? 'danger' : 'success'}`} aria-live="polite">
          {missingCount ? `${missingCount} required field${missingCount > 1 ? 's' : ''} missing` : 'All required fields mapped'}
        </span>
      </div>
      <div className="mapping-grid">
        {schemaFields.map((field) => {
          const isMissing = field.required && !mapping[field.id];
          return (
            <label
              key={field.id}
              className="mapping-row"
              data-required={field.required}
              data-missing={isMissing}
            >
              <span>
                {field.label}
                {field.required && <span aria-hidden="true">*</span>}
              </span>
              <select
                value={mapping[field.id] ?? ''}
                aria-invalid={isMissing}
                disabled={disabled}
                onChange={(event) => onChange(field.id, event.target.value)}
              >
                <option value="">Select column</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <small>{field.description}</small>
            </label>
          );
        })}
      </div>
    </section>
  );
};
