import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatComposer, { type AttachedFile } from "../components/chat/ChatComposer";
import ChatMessage, { type ChatMessageData } from "../components/chat/ChatMessage";
import OutputPreviewPanel from "../components/chat/OutputPreviewPanel";
import {
  applyExtractionScope,
  generateExtractionXml,
  pollExtraction,
  startExtraction,
  clearExtractionTemplate,
  createTemplateFromSource,
  uploadExtractionTemplate,
} from "../services/api";
import { warmBackend } from "../lib/api";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pdfToXmlName(pdfName: string): string {
  return pdfName.replace(/\.pdf$/i, "") + ".xml";
}

function isDocBookTemplate(schema: Record<string, unknown> | undefined): boolean {
  if (!schema) return false;
  if (schema.template_format === "docbook_5_book") return true;
  return schema.root_tag === "book";
}

export default function HeuristicChatAgent() {
  useEffect(() => {
    void warmBackend();
  }, []);

  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Attach a **PDF** and **matching template XML** for this book, then send to convert.\n\n" +
        "You must attach **both files on every run** (a new PDF does not reuse the previous template).\n\n" +
        "Runs in **heuristic mode** (no LLM API key). You will get a preview and download when complete.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [sessionPdf, setSessionPdf] = useState<File | null>(null);
  const [sessionTemplate, setSessionTemplate] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [activeExtractionId, setActiveExtractionId] = useState<string | null>(null);
  const [skipTablesFigures, setSkipTablesFigures] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runGenerationRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessageData>) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const next = { ...m, ...patch };
          if (!("children" in patch)) next.children = m.children;
          return next;
        }),
      );
      scrollToBottom();
    },
    [scrollToBottom],
  );

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
      if (kind === "pdf") {
        setSessionTemplate(null);
      }
      if (kind === "xml") {
        setSessionPdf(null);
      }
    }
    setAttachments(next);
  };

  const pdf = attachments.find((a) => a.kind === "pdf")?.file;
  const template = attachments.find((a) => a.kind === "xml")?.file;
  const canConvert = Boolean(pdf);
  const sendDisabled = sending || !canConvert;

  const onSend = async () => {
    if (!pdf) {
      toast.error("Attach a PDF to convert");
      return;
    }

    setSending(true);
    const runId = ++runGenerationRef.current;
    setInput("");
    const pdfForJob = pdf;
    const templateForJob = template ?? null;
    setSessionPdf(pdfForJob);
    setSessionTemplate(templateForJob);
    setAttachments([]);
    setActiveExtractionId(null);

    const attachNote = templateForJob
      ? `📎 ${pdfForJob.name}\n📎 ${templateForJob.name}`
      : `📎 ${pdfForJob.name}\n📎 (template will be generated from PDF metadata)`;
    appendMessage({
      role: "user",
      content: `${input.trim() || "Convert PDF to IEEE JATS XML."}\n\n${attachNote}`,
    });

    const assistantId = appendMessage({
      role: "assistant",
      content: "Connecting to API…",
      streaming: true,
    });

    const logLines: string[] = [];

    try {
      await warmBackend();
      logLines.push("✓ API ready");
      logLines.push("▸ Uploading PDF…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });

      const started = await startExtraction(pdfForJob, { skipTablesFigures });
      if (runId !== runGenerationRef.current) return;
      setActiveExtractionId(started.extraction_id);
      logLines.push("✓ Upload complete");
      logLines.push("▸ Extracting text and layout…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });

      const record = await pollExtraction(started.extraction_id, (tick) => {
        const step =
          tick.current_step ??
          (tick.status === "queued" ? "Waiting for extraction worker…" : "Processing…");
        const pct =
          typeof tick.progress === "number" && tick.progress > 0 ? ` (${tick.progress}%)` : "";
        updateMessage(assistantId, {
          content: `${logLines.join("\n")}\n▸ ${step}${pct}`,
          streaming: true,
        });
      });
      if (runId !== runGenerationRef.current) return;
      if (record.status === "failed") {
        throw new Error(record.error_message || "Extraction failed");
      }
      logLines.push("✓ Extraction complete");

      let templateUpload;
      if (templateForJob) {
        logLines.push("▸ Uploading template…");
        updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
        templateUpload = await uploadExtractionTemplate(
          started.extraction_id,
          templateForJob,
        );
      } else {
        logLines.push("▸ Generating DocBook template from PDF metadata…");
        updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
        await clearExtractionTemplate(started.extraction_id);
        templateUpload = await createTemplateFromSource(started.extraction_id);
      }
      if (runId !== runGenerationRef.current) return;
      logLines.push("✓ Template linked");
      const docBookTemplate = isDocBookTemplate(templateUpload.schema);

      logLines.push("▸ Applying scope…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
      await applyExtractionScope(started.extraction_id, "full");
      if (runId !== runGenerationRef.current) return;

      logLines.push(
        docBookTemplate
          ? "▸ Generating DocBook 5 XML (heuristic mode)…"
          : "▸ Generating IEEE JATS XML (heuristic mode)…",
      );
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
      const generated = await generateExtractionXml(started.extraction_id, {
        scope: "full",
        useLlm: false,
        llmFallback: true,
      });
      if (runId !== runGenerationRef.current) return;
      logLines.push("✓ XML generated");

      const downloadFilename = generated.output_filename ?? pdfToXmlName(pdfForJob.name);
      updateMessage(assistantId, {
        content: `${logLines.join("\n")}\n\n✅ Ready for preview. Download your XML below.`,
        streaming: false,
        children: (
          <OutputPreviewPanel
            extractionId={started.extraction_id}
            xml={generated.xml_content}
            validationErrors={generated.warnings.filter(
              (w) => !w.toLowerCase().includes("api key"),
            )}
            downloadFilename={downloadFilename}
          />
        ),
      });
      toast.success("Conversion complete — heuristic mode");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      updateMessage(assistantId, {
        content: `${logLines.join("\n")}\n\n✗ ${msg}`,
        streaming: false,
      });
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex shrink-0 items-center justify-center border-b border-slate-800 py-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-slate-100">IEEE XML Converter</h1>
          <p className="text-[11px] text-slate-500">
            Heuristic mode · PDF + template → preview &amp; download
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

      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-1">
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={skipTablesFigures}
            onChange={(e) => setSkipTablesFigures(e.target.checked)}
            disabled={sending}
          />
          Skip tables/figures (faster for large books)
        </label>
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
          mode="convert"
          sessionHint={
            activeExtractionId && sessionPdf && sessionTemplate
              ? `Last: ${sessionPdf.name} + ${sessionTemplate.name}`
              : undefined
          }
        />
      </div>
    </div>
  );
}
