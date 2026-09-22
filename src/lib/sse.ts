import type { AgentEvent } from "../types";

const base = import.meta.env.VITE_API_URL || "";

export function subscribeToJob(jobId: string, onEvent: (event: AgentEvent) => void): () => void {
  const url = `${base}/api/stream/${jobId}`;
  const es = new EventSource(url);

  const handler = (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as AgentEvent;
      onEvent(data);
    } catch {
      /* ignore */
    }
  };

  ["stage", "token", "log", "error", "done", "ping", "message"].forEach((type) => {
    es.addEventListener(type, handler as EventListener);
  });

  es.onmessage = handler;

  return () => es.close();
}
