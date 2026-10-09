import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react";

export type ExtractionUiStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "completed"
  | "failed";

interface ExtractionStatusProps {
  status: ExtractionUiStatus;
  message?: string;
  progress?: number | null;
  currentStep?: string | null;
}

export const ExtractionStatus = ({
  status,
  message,
  progress,
  currentStep,
}: ExtractionStatusProps) => {
  const icon = (() => {
    switch (status) {
      case "uploading":
      case "extracting":
        return <Loader2 size={25} className="spin text-purple-500" />;
      case "completed":
        return <CheckCircle2 size={25} className="text-green-500" />;
      case "failed":
        return <XCircle size={25} className="text-red-500" />;
      default:
        return <FileText size={25} className="text-gray-400" />;
    }
  })();

  const title = (() => {
    switch (status) {
      case "uploading":
        return "Uploading";
      case "extracting":
        return "Extracting";
      case "completed":
        return "Extraction Complete";
      case "failed":
        return "Extraction Failed";
      default:
        return "Ready";
    }
  })();

  const statusClass =
    status === "idle"
      ? "idle"
      : status === "completed"
        ? "success"
        : status === "failed"
          ? "error"
          : status === "uploading"
            ? "uploading"
            : "converting";

  return (
    <div className="status-container">
      <h3>Extraction Status</h3>
      <div className={`status ${statusClass}`}>
        {icon}
        <div>
          <strong>{title}</strong>
          {currentStep && (status === "uploading" || status === "extracting") ? (
            <p className="text-sm text-gray-600">{currentStep}</p>
          ) : null}
          <p>{message || "Select a PDF and click Extract Text to begin."}</p>
          {typeof progress === "number" &&
          progress > 0 &&
          (status === "uploading" || status === "extracting") ? (
            <div className="extraction-progress-bar" aria-label="Extraction progress">
              <div
                className="extraction-progress-bar__fill"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
              <span className="extraction-progress-bar__label">{progress}%</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
