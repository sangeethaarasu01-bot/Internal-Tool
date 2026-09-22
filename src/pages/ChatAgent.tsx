import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import ChatComposer, { type AttachedFile } from "../components/chat/ChatComposer";
import ChatMessage, { type ChatMessageData } from "../components/chat/ChatMessage";
import OutputPreviewPanel from "../components/chat/OutputPreviewPanel";
import { downloadUrl, getJob, getResult, refineJob, startConvert, uploadFiles } from "../lib/api";
import { subscribeToJob } from "../lib/sse";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatAgent() {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Attach PDF + XML template, then send to convert.\n\nAfter conversion you will get a **preview** — download when happy, or type fixes here and send again (no need to re-attach files).",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [sessionPdf, setSessionPdf] = useState<File | null>(null);
  const [sessionTemplate, setSessionTemplate] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
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

  const showPreview = useCallback(
    (jobId: string, xml: string, errors: string[], assistantId: string, logLines: string[]) => {
      setActiveJobId(jobId);
      updateMessage(assistantId, {
        content: `${logLines.join("\n")}\n\n✅ Ready for preview. Download or send fixes below.`,
        streaming: false,
        children: (
          <OutputPreviewPanel jobId={jobId} xml={xml} validationErrors={errors} />
        ),
      });
      setSending(false);
      toast.success("Preview ready — review XML, then download or ask for fixes");
    },
    [updateMessage],
  );

  const finalizeJob = useCallback(
    async (jobId: string, assistantId: string, logLines: string[]) => {
      if (finalizedJobs.current.has(jobId)) return;
      try {
        const job = await getJob(jobId);
        if (job.status !== "completed") return;
        finalizedJobs.current.add(jobId);
        let xml = "";
        let errors: string[] = [];
        try {
          const result = await getResult(jobId);
          xml = result.xml_content || "";
          errors = result.validation?.errors || [];
        } catch {
          const res = await fetch(downloadUrl(jobId));
          xml = await res.text();
        }
        showPreview(jobId, xml, errors, assistantId, logLines);
      } catch (e) {
        toast.error(`Could not load result: ${e}`);
        setSending(false);
      }
    },
    [showPreview],
  );

  const runRefine = async (jobId: string, instruction: string) => {
    setSending(true);
    appendMessage({ role: "user", content: instruction });
    const assistantId = appendMessage({
      role: "assistant",
      content: "Applying your fixes…",
      streaming: true,
    });
    try {
      const result = await refineJob(jobId, instruction);
      const errors = result.validation?.errors || [];
      updateMessage(assistantId, {
        content: "✅ Updated XML based on your message.",
        streaming: false,
        children: (
          <OutputPreviewPanel
            jobId={jobId}
            xml={result.xml_content}
            validationErrors={errors}
          />
        ),
      });
      toast.success("XML updated — check preview");
    } catch (e) {
      updateMessage(assistantId, { content: `✗ ${String(e)}`, streaming: false });
    } finally {
      setSending(false);
    }
  };

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

  const pdf = attachments.find((a) => a.kind === "pdf")?.file ?? sessionPdf;
  const template = attachments.find((a) => a.kind === "xml")?.file ?? sessionTemplate;
  const hasNewAttachments = attachments.some((a) => a.kind === "pdf") && attachments.some((a) => a.kind === "xml");
  const canRefine = Boolean(activeJobId && input.trim() && !hasNewAttachments);
  const canConvert = Boolean(pdf && template);
  const sendDisabled = sending || (!canRefine && !canConvert);

  const onSend = async () => {
    const text = input.trim();

    if (canRefine) {
      setInput("");
      await runRefine(activeJobId!, text);
      return;
    }

    if (!pdf || !template) {
      toast.error("Attach PDF and XML template for a new conversion");
      return;
    }

    setSending(true);
    setInput("");
    setSessionPdf(pdf);
    setSessionTemplate(template);
    setAttachments([]);
    finalizedJobs.current.clear();

    const attachNote = `📎 ${pdf.name}\n📎 ${template.name}`;
    appendMessage({ role: "user", content: `${text || "Convert PDF to XML template."}\n\n${attachNote}` });

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
      updateMessage(assistantId, { content: `✗ ${String(e)}`, streaming: false });
      setSending(false);
    }
  };

  const composerMode = activeJobId ? "followup" : "convert";

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex shrink-0 items-center justify-center border-b border-slate-800 py-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-slate-100">IEEE XML Converter</h1>
          <p className="text-[11px] text-slate-500">
            {activeJobId ? "Preview → download → or chat to fix" : "PDF + template → convert"}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
        <div className="mx-auto max-w-3xl">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>
      </div>

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
          mode={composerMode}
          sessionHint={
            activeJobId && sessionPdf && sessionTemplate
              ? `Session: ${sessionPdf.name} + ${sessionTemplate.name}`
              : undefined
          }
        />
      </div>
    </div>
  );
}
