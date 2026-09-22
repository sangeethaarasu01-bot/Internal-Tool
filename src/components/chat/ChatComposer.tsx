import { Paperclip, Send, X } from "lucide-react";
import { useRef } from "react";
import { cn } from "../../lib/utils";

export interface AttachedFile {
  id: string;
  file: File;
  kind: "pdf" | "xml";
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  attachments: AttachedFile[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
  sendDisabled?: boolean;
  sending?: boolean;
  mode?: "convert" | "followup";
  sessionHint?: string;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  sendDisabled,
  sending,
  mode = "convert",
  sessionHint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled && !sending) onSend();
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3 text-cyan-400" />
              <span className="max-w-[200px] truncate">{a.file.name}</span>
              <span className="text-slate-500">{a.kind.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(a.id)}
                className="text-slate-400 hover:text-white"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-lg">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-400"
          title="Attach PDF or XML template"
          disabled={sending}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.xml,application/pdf,application/xml,text/xml"
          multiple
          onChange={(e) => {
            onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            mode === "followup"
              ? "Fix request… e.g. encode special chars as &#x2013;, fix author names, re-validate"
              : "Type a message… e.g. Convert this IEEE PDF to the attached XML template"
          }
          rows={1}
          disabled={sending}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled || sending}
          className={cn(
            "rounded-xl p-2.5 transition",
            sendDisabled || sending
              ? "bg-slate-800 text-slate-600"
              : "bg-cyan-600 text-white hover:bg-cyan-500",
          )}
          title="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        {mode === "followup" ? (
          <>
            {sessionHint ? <span className="block text-slate-600">{sessionHint}</span> : null}
            Send to <strong>fix</strong> the current XML (no re-attach). Attach files only for a{" "}
            <strong>new</strong> conversion. Shift+Enter = new line.
          </>
        ) : (
          <>
            Attach <strong>PDF</strong> + <strong>XML template</strong>, then send. Shift+Enter = new line.
          </>
        )}
      </p>
    </div>
  );
}
