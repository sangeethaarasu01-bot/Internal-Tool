import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AgentLogStream from "../components/AgentLogStream";
import AgentTimeline, { type StageItem } from "../components/AgentTimeline";
import DownloadButton from "../components/DownloadButton";
import MappingTable from "../components/MappingTable";
import SchemaMapViewer from "../components/SchemaMapViewer";
import ValidationPanel from "../components/ValidationPanel";
import XmlDiff from "../components/XmlDiff";
import XmlPreview from "../components/XmlPreview";
import { getJob, getResult, getSchemaForJob } from "../lib/api";

const STAGE_NAMES = ["Schema", "PDF extract", "Matching", "Generation", "Validation"];

export default function JobDetail() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState("output");

  const { data: job, refetch } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 2000 : false),
  });

  const { data: result } = useQuery({
    queryKey: ["result", id],
    queryFn: () => getResult(id),
    enabled: !!job,
    refetchInterval: job?.status === "processing" ? 3000 : false,
  });

  const { data: schemaJob } = useQuery({
    queryKey: ["schema-job", id],
    queryFn: () => getSchemaForJob(id),
    enabled: job?.status === "completed",
  });

  const stages: StageItem[] = useMemo(() => {
    const p = job?.progress ?? 0;
    return STAGE_NAMES.map((name, i) => {
      const threshold = (i + 1) * 20;
      let status: StageItem["status"] = "pending";
      if (job?.status === "failed") status = i === 0 ? "error" : "pending";
      else if (p >= threshold) status = "done";
      else if (p >= threshold - 15) status = "active";
      return { name, status, message: job?.stage };
    });
  }, [job]);

  if (!job) return <p>Loading job…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job {id.slice(0, 8)}…</h1>
        <DownloadButton jobId={id} enabled={job.status === "completed"} />
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-800">
        <div className="h-full bg-cyan-500 transition-all" style={{ width: `${job.progress}%` }} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AgentTimeline stages={stages} />
        <AgentLogStream jobId={id} />
        <div className="rounded border border-slate-800 bg-slate-900 p-3">
          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {["output", "diff", "schema", "mapping", "validation"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-2 py-1 ${tab === t ? "bg-cyan-700" : "bg-slate-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "output" && <XmlPreview xml={result?.xml_content || ""} title="Output XML" />}
          {tab === "diff" && (
            <XmlDiff oldValue={"<!-- template -->\n"} newValue={result?.xml_content || ""} />
          )}
          {tab === "schema" && schemaJob?.schema_map && (
            <SchemaMapViewer elements={schemaJob.schema_map.elements} />
          )}
          {tab === "mapping" && schemaJob?.mapping_plan && (
            <MappingTable mappings={schemaJob.mapping_plan.mappings} />
          )}
          {tab === "validation" && result?.validation && (
            <ValidationPanel validation={result.validation} />
          )}
        </div>
      </div>
      <button className="text-xs text-slate-500" onClick={() => refetch()}>Refresh status</button>
    </div>
  );
}
