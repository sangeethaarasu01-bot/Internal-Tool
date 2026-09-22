import { useMemo, useState } from "react";
import type { MappingEntry } from "../types";

export default function MappingTable({ mappings }: { mappings: MappingEntry[] }) {
  const [lowOnly, setLowOnly] = useState(false);
  const rows = useMemo(
    () => (lowOnly ? mappings.filter((m) => m.confidence < 0.7) : mappings),
    [mappings, lowOnly],
  );

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
        Show only confidence &lt; 0.7 (human review)
      </label>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="p-2">XPath</th>
            <th className="p-2">PDF field</th>
            <th className="p-2">Transform</th>
            <th className="p-2">Conf.</th>
            <th className="p-2">Reasoning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.xml_xpath + m.pdf_field} className="border-t border-slate-800">
              <td className="p-2 font-mono">{m.xml_xpath}</td>
              <td className="p-2">{m.pdf_field}</td>
              <td className="p-2">{m.transform}</td>
              <td className="p-2">{m.confidence.toFixed(2)}</td>
              <td className="p-2 text-slate-400">{m.reasoning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
