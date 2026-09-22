import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { listJobs } from "../lib/api";
import type { JobStatus } from "../types";

export default function JobsHistory() {
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: listJobs });

  const filtered = useMemo(
    () => (filter === "all" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Jobs</h1>
      <select
        className="mb-4 rounded border border-slate-700 bg-slate-900 p-2 text-sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value as JobStatus | "all")}
      >
        <option value="all">All</option>
        <option value="completed">completed</option>
        <option value="processing">processing</option>
        <option value="failed">failed</option>
      </select>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">PDF</th>
            <th className="p-2">Status</th>
            <th className="p-2">Cost</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((j) => (
            <tr key={j.id} className="border-t border-slate-800 hover:bg-slate-900/50">
              <td className="p-2">
                <Link to={`/job/${j.id}`} className="text-cyan-400">{j.id.slice(0, 8)}</Link>
              </td>
              <td className="p-2">{j.pdf_filename}</td>
              <td className="p-2">{j.status}</td>
              <td className="p-2">${j.llm_cost_usd.toFixed(3)}</td>
              <td className="p-2">{new Date(j.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
