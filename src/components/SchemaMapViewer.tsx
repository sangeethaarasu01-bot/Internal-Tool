import { useState } from "react";
import type { SchemaElement } from "../types";

function Node({ el }: { el: SchemaElement }) {
  const [open, setOpen] = useState(true);
  return (
    <li className="ml-3 border-l border-slate-700 pl-2">
      <button type="button" onClick={() => setOpen(!open)} className="text-left text-xs">
        <span className="font-mono text-cyan-300">{el.tag}</span>
        <span className="ml-2 text-slate-500">{el.semantic}</span>
        <span className="ml-1 rounded bg-slate-800 px-1">{el.cardinality}</span>
        <span className="ml-1 rounded bg-slate-800 px-1">{el.data_type}</span>
        {el.required && <span className="ml-1 text-amber-400">req</span>}
      </button>
      {open && el.children?.length > 0 && (
        <ul className="mt-1">
          {el.children.map((c) => (
            <Node key={c.xpath} el={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SchemaMapViewer({ elements }: { elements: SchemaElement[] }) {
  return (
    <ul className="max-h-96 overflow-y-auto text-sm">
      {elements.map((e) => (
        <Node key={e.xpath} el={e} />
      ))}
    </ul>
  );
}
