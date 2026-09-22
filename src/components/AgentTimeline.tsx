export interface StageItem {
  name: string;
  status: "pending" | "active" | "done" | "error";
  message?: string;
  duration?: string;
}

const icon: Record<StageItem["status"], string> = {
  pending: "⏳",
  active: "🔄",
  done: "✅",
  error: "❌",
};

export default function AgentTimeline({ stages }: { stages: StageItem[] }) {
  return (
    <ul className="space-y-3">
      {stages.map((s) => (
        <li key={s.name} className="rounded border border-slate-800 bg-slate-900 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span>{icon[s.status]}</span>
            <span className="font-medium">{s.name}</span>
            {s.duration && <span className="text-xs text-slate-500">{s.duration}</span>}
          </div>
          {s.message && <p className="mt-1 text-xs text-slate-400">{s.message}</p>}
          {s.status === "active" && (
            <div className="mt-2 h-1 overflow-hidden rounded bg-slate-800">
              <div className="h-full w-1/2 animate-pulse bg-cyan-500" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
