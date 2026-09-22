import { useEffect, useRef, useState } from "react";
import type { AgentEvent } from "../types";
import { subscribeToJob } from "../lib/sse";

const color: Record<string, string> = {
  stage: "text-cyan-400",
  log: "text-slate-300",
  token: "text-violet-300",
  error: "text-red-400",
  done: "text-green-400",
};

export default function AgentLogStream({ jobId }: { jobId: string }) {
  const [lines, setLines] = useState<{ type: string; text: string }[]>([]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeToJob(jobId, (e: AgentEvent) => {
      if (e.type === "ping") return;
      setLines((prev) => [
        ...prev,
        { type: e.type, text: e.message || JSON.stringify(e) },
      ]);
    });
  }, [jobId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="flex h-[420px] flex-col rounded border border-slate-800 bg-black/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
        <span>Agent stream</span>
        <button className="text-slate-400 hover:text-white" onClick={() => setLines([])}>
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {lines.map((l, i) => (
          <div key={i} className={color[l.type] || "text-slate-400"}>
            [{l.type}] {l.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
    </div>
  );
}
