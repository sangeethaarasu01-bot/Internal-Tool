import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";

interface Props {
  label: string;
  accept: Record<string, string[]>;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}

export default function FileUpload({ label, accept, file, onFile, disabled }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    disabled,
    onDrop: (files) => onFile(files[0] ?? null),
  });

  return (
    <div
      {...getRootProps()}
      className={`rounded-lg border border-dashed p-6 text-center transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-cyan-500"
      } ${isDragActive ? "border-cyan-400 bg-cyan-950/30" : "border-slate-600"}`}
    >
      <input {...getInputProps()} />
      <p className="text-sm font-medium">{label}</p>
      {file ? (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          {!disabled && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Drop file or click</p>
      )}
    </div>
  );
}
