import type { AgentEvent } from "../types";
import { resolveApiBaseUrl } from "./apiBase";

const base = resolveApiBaseUrl();

/** Production: skip EventSource (long connections die on Render); use job polling instead. */
export function shouldUseJobStream(): boolean {
  return import.meta.env.DEV;
}

export function subscribeToJob(
  jobId: string,
  onEvent: (event: AgentEvent) => void,
): () => void {
  if (!shouldUseJobStream()) {
    return () => {};
  }
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
