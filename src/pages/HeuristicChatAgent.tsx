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
  uploadExtractionTemplate,
} from "../services/api";
import { warmBackend } from "../lib/api";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pdfToXmlName(pdfName: string): string {
  return pdfName.replace(/\.pdf$/i, "") + ".xml";
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
        "Attach a **PDF** and **IEEE JATS template XML**, then send to convert.\n\n" +
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    }
    setAttachments(next);
  };

  const pdf = attachments.find((a) => a.kind === "pdf")?.file ?? sessionPdf;
  const template = attachments.find((a) => a.kind === "xml")?.file ?? sessionTemplate;
  const canConvert = Boolean(pdf && template);
  const sendDisabled = sending || !canConvert;

  const onSend = async () => {
    if (!pdf || !template) {
      toast.error("Attach PDF and XML template to convert");
      return;
    }

    setSending(true);
    setInput("");
    setSessionPdf(pdf);
    setSessionTemplate(template);
    setAttachments([]);
    setActiveExtractionId(null);

    const attachNote = `📎 ${pdf.name}\n📎 ${template.name}`;
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

      const started = await startExtraction(pdf);
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
      if (record.status === "failed") {
        throw new Error(record.error_message || "Extraction failed");
      }
      logLines.push("✓ Extraction complete");

      logLines.push("▸ Uploading template…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
      await uploadExtractionTemplate(started.extraction_id, template);
      logLines.push("✓ Template linked");

      logLines.push("▸ Applying scope…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
      await applyExtractionScope(started.extraction_id, "full");

      logLines.push("▸ Generating IEEE JATS XML (heuristic mode)…");
      updateMessage(assistantId, { content: logLines.join("\n"), streaming: true });
      const generated = await generateExtractionXml(started.extraction_id, {
        scope: "full",
        useLlm: false,
        llmFallback: true,
      });
      logLines.push("✓ XML generated");

      const downloadFilename = pdfToXmlName(pdf.name);
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
