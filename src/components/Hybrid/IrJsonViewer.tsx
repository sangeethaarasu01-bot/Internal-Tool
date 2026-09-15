import { useMemo } from "react";
import { countIrSections, type DocumentScope } from "../../utils/irJson";

interface IrJsonViewerProps {
  filteredIr: Record<string, unknown>;
  fullIr?: Record<string, unknown> | null;
  scope: DocumentScope;
  serverScoped?: boolean;
}

export const IrJsonViewer = ({
  filteredIr,
  fullIr,
  scope,
  serverScoped = false,
}: IrJsonViewerProps) => {
  const counts = useMemo(() => countIrSections(fullIr ?? filteredIr), [fullIr, filteredIr]);
  const filteredCounts = useMemo(() => countIrSections(filteredIr), [filteredIr]);

  const jsonText = useMemo(
    () => JSON.stringify(filteredIr, null, 2),
    [filteredIr],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch {
      window.alert("Could not copy JSON to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ir-${scope}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ir-json-viewer">
      <div className="ir-json-viewer__badges">
        <span className="ir-section-badge ir-section-badge--front">
          front: {counts.front}
          {scope !== "full" ? ` → ${filteredCounts.front}` : ""}
        </span>
        <span className="ir-section-badge ir-section-badge--body">
          body: {counts.body}
          {scope !== "full" ? ` → ${filteredCounts.body}` : ""}
        </span>
        <span className="ir-section-badge ir-section-badge--back">
          back: {counts.back}
          {scope !== "full" ? ` → ${filteredCounts.back}` : ""}
        </span>
        {scope !== "full" ? (
          <span className="ir-json-viewer__preview-note">
            {serverScoped ? "Server-scoped IR" : "Scoped preview"}
          </span>
        ) : null}
      </div>

      <div className="ir-json-viewer__actions">
        <button type="button" className="browse-button" onClick={handleCopy}>
          Copy JSON
        </button>
        <button type="button" className="browse-button" onClick={handleDownload}>
          Download IR JSON
        </button>
      </div>

      <pre className="extraction-text ir-json-viewer__pre">{jsonText}</pre>
    </div>
  );
};
