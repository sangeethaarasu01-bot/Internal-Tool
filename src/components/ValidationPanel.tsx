import type { ValidationResult } from "../types";

export default function ValidationPanel({ validation }: { validation: ValidationResult }) {
  return (
    <div className={`rounded border p-4 ${validation.valid ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30"}`}>
      <p className="font-medium">{validation.valid ? "Validation passed" : "Validation failed"}</p>
      {!validation.valid && (
        <ul className="mt-2 list-disc pl-5 text-sm text-red-200">
          {validation.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-500">Cross-ref and DTD checks run server-side.</p>
    </div>
  );
}
