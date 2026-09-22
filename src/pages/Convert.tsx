import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import FileUpload from "../components/FileUpload";
import { listClients, startConvert, uploadFiles } from "../lib/api";

export default function Convert() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clientMode = params.get("mode") === "client";

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const onSubmit = async () => {
    if (!pdf) {
      toast.error("PDF required");
      return;
    }
    if (!clientId && !template) {
      toast.error("Template required without client");
      return;
    }
    setLoading(true);
    try {
      const { job_id } = await uploadFiles(pdf, template ?? undefined, clientId || undefined);
      await startConvert(job_id);
      toast.success("Conversion started");
      navigate(`/job/${job_id}`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Convert</h1>
      <p className="text-sm text-slate-400">
        Typical run: 2–5 minutes. Estimated LLM cost: $0.15–$0.80 per paper (Claude Sonnet + Haiku).
      </p>
      {(clientMode || clients.length > 0) && (
        <div>
          <label className="text-sm text-slate-400">Client (optional)</label>
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">— Ad-hoc —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <FileUpload label="IEEE PDF" accept={{ "application/pdf": [".pdf"] }} file={pdf} onFile={setPdf} />
      <FileUpload
        label="XML template"
        accept={{ "application/xml": [".xml"], "text/xml": [".xml"] }}
        file={template}
        onFile={setTemplate}
        disabled={!!clientId}
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
      >
        {loading ? "Starting…" : "Convert"}
      </button>
    </div>
  );
}
