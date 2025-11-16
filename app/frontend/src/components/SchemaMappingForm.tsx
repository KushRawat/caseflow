import type { SchemaFieldId, SchemaMapping } from '../utils/schema';
import { schemaFields } from '../utils/schema';

interface SchemaMappingFormProps {
  mapping: SchemaMapping;
  headers: string[];
  onChange: (field: SchemaFieldId, header: string) => void;
}

export const SchemaMappingForm = ({ mapping, headers, onChange }: SchemaMappingFormProps) => (
  <section className="surface-card" aria-labelledby="mapping-heading">
    <h2 id="mapping-heading">Schema mapping</h2>
    <p>Map CSV columns to the CaseFlow schema.</p>
    <div className="mapping-grid">
      {schemaFields.map((field) => (
        <label key={field.id} className="mapping-row">
          <span>
            {field.label}
            {field.required && <span aria-hidden="true">*</span>}
          </span>
          <select value={mapping[field.id] ?? ''} onChange={(event) => onChange(field.id, event.target.value)}>
            <option value="">Select column</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
          <small>{field.description}</small>
        </label>
      ))}
    </div>
  </section>
);
