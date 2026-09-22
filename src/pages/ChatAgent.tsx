import { Download } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import ChatComposer, { type AttachedFile } from "../components/chat/ChatComposer";
import ChatMessage, { type ChatMessageData } from "../components/chat/ChatMessage";
import { downloadUrl, getJob, getResult, startConvert, uploadFiles } from "../lib/api";
import { subscribeToJob } from "../lib/sse";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function DownloadPanel({ jobId }: { jobId: string }) {
  const url = downloadUrl(jobId);
  return (
    <div className="mt-4 rounded-xl border border-cyan-800/60 bg-cyan-950/40 p-4">
      <p className="mb-2 text-sm font-medium text-cyan-100">Your output XML is ready</p>
      <a
        href={url}
        download={`${jobId}.xml`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        <Download className="h-4 w-4" />
        Download output.xml
      </a>
      <p className="mt-2 text-[11px] text-slate-500">
        Or open:{" "}
        <a href={url} className="text-cyan-400 underline" target="_blank" rel="noreferrer">
          {url}
        </a>
      </p>
      <p className="mt-1 text-[11px] text-slate-600">
        Server file: backend/data/outputs/{jobId}.xml
      </p>
    </div>
  );
}

export default function ChatAgent() {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I'm your IEEE XML conversion agent.\n\nAttach your IEEE PDF and XML template (paperclip), then send.\n\nWhen done, use **Download output.xml** in my reply (or the green bar at the bottom).",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [sending, setSending] = useState(false);
  const [readyJobId, setReadyJobId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const finalizedJobs = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessageData>) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, ...patch };
        if (!("children" in patch)) next.children = m.children;
        return next;
      }),
    );
    scrollToBottom();
  }, [scrollToBottom]);

  const appendMessage = useCallback(
    (msg: Omit<ChatMessageData, "id" | "timestamp"> & { id?: string }) => {
      const full: ChatMessageData = {
        id: msg.id ?? uid(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(),
        streaming: msg.streaming,
        children: msg.children,
      };
      setMessages((prev) => [...prev, full]);
      scrollToBottom();
      return full.id;
    },
    [scrollToBottom],
  );

  const finalizeJob = useCallback(
    async (jobId: string, assistantId: string, logLines: string[]) => {
      if (finalizedJobs.current.has(jobId)) return;
      try {
        const job = await getJob(jobId);
        if (job.status !== "completed") return;
        finalizedJobs.current.add(jobId);
        let validNote = "";
        try {
          const result = await getResult(jobId);
          validNote = result.validation?.valid ? "Validation passed." : "Validation has warnings.";
        } catch {
          validNote = "Output file is ready (preview API skipped).";
        }
        setReadyJobId(jobId);
        updateMessage(assistantId, {
          content: `${logLines.join("\n")}\n\n✅ Conversion complete. ${validNote}`,
          streaming: false,
          children: <DownloadPanel jobId={jobId} />,
        });
        setSending(false);
        setAttachments([]);
        toast.success("XML ready — click Download output.xml");
      } catch (e) {
        toast.error(`Could not load result: ${e}`);
      }
    },
    [updateMessage],
  );

  const onAddFiles = (files: FileList | null) => {
    if (!files) return;
    let next: AttachedFile[] = [...attachments];
    for (const file of Array.from(files)) {
      const lower = file.name.toLowerCase();
      let kind: "pdf" | "xml" | null = null;
      if (lower.endsWith(".pdf")) kind = "pdf";
      else if (lower.endsWith(".xml")) kind = "xml";
      else {
        toast.error(`${file.name}: only .pdf and .xml allowed`);
        continue;
      }
      next = next.filter((a) => a.kind !== kind);
      next.push({ id: uid(), file, kind });
    }
    setAttachments(next);
  };

  const pdf = attachments.find((a) => a.kind === "pdf")?.file;
  const template = attachments.find((a) => a.kind === "xml")?.file;
  const sendDisabled = !pdf || !template || sending;

  const onSend = async () => {
    const text = input.trim() || "Convert the attached IEEE PDF to the XML template.";
    if (!pdf || !template) {
      toast.error("Attach both PDF and XML template first");
      return;
    }

    setSending(true);
    setReadyJobId(null);
    setInput("");
    const attachNote = attachments.map((a) => `📎 ${a.file.name}`).join("\n");
    appendMessage({ role: "user", content: `${text}\n\n${attachNote}` });

    const assistantId = appendMessage({
      role: "assistant",
      content: "Starting conversion pipeline…",
      streaming: true,
    });

    const logLines: string[] = [];

    try {
      const { job_id } = await uploadFiles(pdf, template);
      await startConvert(job_id);

      const unsub = subscribeToJob(job_id, (ev) => {
        if (ev.type === "ping") return;
        const line = ev.message || ev.type;
        if (ev.type === "stage") {
          logLines.push(`▸ ${line}${ev.progress != null ? ` (${ev.progress}%)` : ""}`);
        } else if (ev.type === "log") {
          logLines.push(`  ${line}`);
        } else if (ev.type === "error") {
          logLines.push(`✗ ${line}`);
        }
        updateMessage(assistantId, {
          content: logLines.join("\n") || "Working…",
          streaming: ev.type !== "done" && ev.type !== "error",
        });
        if (ev.type === "done") {
          unsub();
          void finalizeJob(job_id, assistantId, [...logLines]);
        }
        if (ev.type === "error") {
          unsub();
          setSending(false);
        }
      });

      const poll = async () => {
        for (let i = 0; i < 120; i++) {
          const job = await getJob(job_id);
          if (job.status === "completed") {
            unsub();
            await finalizeJob(job_id, assistantId, [...logLines]);
            return;
          }
          if (job.status === "failed") {
            unsub();
            updateMessage(assistantId, {
              content: `${logLines.join("\n")}\n\n✗ Failed: ${job.error || "Unknown error"}`,
              streaming: false,
            });
            setSending(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
        setSending(false);
      };
      void poll();
    } catch (e) {
      updateMessage(assistantId, {
        content: `✗ ${String(e)}`,
        streaming: false,
      });
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex shrink-0 items-center justify-center border-b border-slate-800 py-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-slate-100">IEEE XML Converter</h1>
          <p className="text-[11px] text-slate-500">Schema-adaptive LLM agent</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
        <div className="mx-auto max-w-3xl">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>
      </div>

      {readyJobId && (
        <div className="shrink-0 border-t border-cyan-900/50 bg-cyan-950/80 px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="text-sm text-cyan-100">Output ready</span>
            <a
              href={downloadUrl(readyJobId)}
              download={`${readyJobId}.xml`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
            >
              <Download className="h-4 w-4" />
              Download XML
            </a>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl shrink-0">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={onSend}
          attachments={attachments}
          onAddFiles={onAddFiles}
          onRemoveAttachment={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
          sendDisabled={sendDisabled}
          sending={sending}
        />
      </div>
    </div>
  );
}
