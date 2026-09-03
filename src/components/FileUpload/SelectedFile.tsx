import { FileText, Trash2, FileCode2 } from "lucide-react";

interface SelectedFileProps {
  file: File;
  onRemove: () => void;
}

export const SelectedFile = ({ file, onRemove }: SelectedFileProps) => {
  // Get file extension and validate
  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toUpperCase() || "PDF";
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  // Mock data - In real app, you'd get this from PDF parsing
  const fileInfo = {
    pages: 12,
    uploaded: new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    format: getFileExtension(file.name),
  };

  return (
    <div className="selected-file">
      <h3>Selected File</h3>

      <div className="file-row">
        <div className="pdf-icon">
          <FileText size={27} />
        </div>

        <div className="file-info">
          <strong>{file.name}</strong>
          <span>{formatFileSize(file.size)}</span>
        </div>

        <button
          className="delete-button"
          onClick={onRemove}
          title="Remove file"
        >
          <Trash2 size={19} />
        </button>
      </div>

      {/* File Details */}
      <div className="file-details">
        <div className="details-title">
          <FileCode2 size={17} />
          <strong>File Info</strong>
        </div>

        <div className="detail-row">
          <span>Pages:</span>
          <strong>{fileInfo.pages}</strong>
        </div>

        <div className="detail-row">
          <span>Uploaded:</span>
          <strong>{fileInfo.uploaded}</strong>
        </div>

        <div className="detail-row">
          <span>Format:</span>
          <strong>{fileInfo.format}</strong>
        </div>
      </div>
    </div>
  );
};
