import { Download } from "lucide-react";
import XmlPreview from "../XmlPreview";
import { downloadUrl } from "../../lib/api";

interface Props {
  jobId: string;
  xml: string;
  validationErrors: string[];
  onDownload?: () => void;
}

export default function OutputPreviewPanel({ jobId, xml, validationErrors, onDownload }: Props) {
  const url = downloadUrl(jobId);
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-cyan-100">Preview output XML</p>
        <a
          href={url}
          download={`${jobId}.xml`}
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-2 text-xs text-amber-200">
          <p className="font-medium">Validation notes</p>
          <ul className="mt-1 list-disc pl-4">
            {validationErrors.slice(0, 5).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-700">
        <XmlPreview xml={xml.slice(0, 120000)} title="output.xml (truncated in preview)" />
      </div>
      <p className="text-[11px] text-slate-500">
        Review above, then download — or type a fix below (e.g. &quot;use &#x2013; for en-dash in title&quot;) and
        send.
      </p>
    </div>
  );
}
