import type { DocumentScope } from "../../utils/irJson";

const SCOPE_OPTIONS: { value: DocumentScope; label: string; description: string }[] = [
  {
    value: "front",
    label: "Front Matter",
    description: "Title, authors, abstract, keywords",
  },
  {
    value: "body",
    label: "Body Matter",
    description: "Sections, paragraphs, figures, tables, equations",
  },
  {
    value: "back",
    label: "Back Matter",
    description: "References, acknowledgments, bios",
  },
  {
    value: "full",
    label: "Full Document",
    description: "Front + body + back",
  },
];

interface ScopeSelectorProps {
  value: DocumentScope;
  onChange: (scope: DocumentScope) => void;
  disabled?: boolean;
}

export const ScopeSelector = ({ value, onChange, disabled = false }: ScopeSelectorProps) => {
  return (
    <div className="scope-selector">
      <div className="scope-selector__header">
        <label htmlFor="scope-select">Scope instruction</label>
      </div>
      <select
        id="scope-select"
        className="scope-selector__select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as DocumentScope)}
      >
        {SCOPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="scope-selector__help">
        {SCOPE_OPTIONS.find((option) => option.value === value)?.description}. Filtered via{" "}
        <code>POST /api/extractions/:id/scope</code> after extraction completes.
      </p>
    </div>
  );
};
