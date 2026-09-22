import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function XmlPreview({ xml, title }: { xml: string; title?: string }) {
  const copy = () => navigator.clipboard.writeText(xml);
  return (
    <div className="rounded border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
        <span>{title || "XML"}</span>
        <button onClick={copy} className="text-cyan-400 hover:underline">Copy</button>
      </div>
      <SyntaxHighlighter language="xml" style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, fontSize: "11px" }}>
        {xml || "<!-- empty -->"}
      </SyntaxHighlighter>
    </div>
  );
}
