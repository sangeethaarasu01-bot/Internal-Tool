import { downloadUrl } from "../lib/api";

export default function DownloadButton({ jobId, enabled }: { jobId: string; enabled: boolean }) {
  if (!enabled) {
    return (
      <button disabled className="rounded bg-slate-700 px-4 py-2 text-sm opacity-50">
        Download XML
      </button>
    );
  }
  return (
    <a
      href={downloadUrl(jobId)}
      className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
    >
      Download XML
    </a>
  );
}
