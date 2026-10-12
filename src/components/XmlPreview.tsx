import { useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { serializeXmlStringWithHexQuoteEntities } from "../utils/xmlSerializer";

export default function XmlPreview({
  xml,
  title,
}: {
  xml: string;
  title?: string;
}) {
  const displayXml = useMemo(() => {
    if (!xml?.trim()) {
      return "";
    }
    return serializeXmlStringWithHexQuoteEntities(xml);
  }, [xml]);

  const copy = () => navigator.clipboard.writeText(displayXml);
  return (
    <div className="rounded border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
        <span>{title || "XML"}</span>
        <button onClick={copy} className="text-cyan-400 hover:underline">
          Copy
        </button>
      </div>
      <SyntaxHighlighter
        language="xml"
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{ margin: 0, fontSize: "11px" }}
      >
        {displayXml || "<!-- empty -->"}
      </SyntaxHighlighter>
    </div>
  );
}
