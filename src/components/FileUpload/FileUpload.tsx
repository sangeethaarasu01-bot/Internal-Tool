import { Upload, FileText, Trash2, FileCode2 } from "lucide-react";
import { useState } from "react";
import { formatFileSize, isPdfFile } from "../../utils/pdfFile";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  pageCount?: number | null;
}

export const FileUpload = ({
  onFileSelect,
  selectedFile,
  onRemove,
  pageCount = null,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isPdfFile(file)) {
      onFileSelect(file);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isPdfFile(file)) {
      onFileSelect(file);
    } else {
      alert("Please drop a valid PDF file");
    }
  };

  return (
    <div className="upload-grid">
      {/* Left Column - Drop Zone (Always Visible) */}
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <Upload size={35} />
        </div>

        <h3>Drag & drop your PDF here</h3>

        <span className="or">or</span>

        <input
          type="file"
          id="file-input"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <label htmlFor="file-input" className="browse-button">
          Browse File
        </label>

        <p>Only PDF files are supported</p>
      </div>

      {/* Right Column - Selected File (Shows when file selected) */}
      <div
        className={`selected-file-panel ${selectedFile ? "has-file" : "empty"}`}
      >
        {selectedFile ? (
          <>
            <div className="selected-file-header">
              <div className="selected-file-icon">
                <FileText size={24} />
              </div>
              <div className="selected-file-info">
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                className="remove-file-btn"
                onClick={onRemove}
                title="Remove file"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="selected-file-details">
              <div className="detail-item">
                <FileCode2 size={16} />
                <span>File Info</span>
              </div>
              <div className="detail-grid">
                <div className="detail-row">
                  <span>Pages:</span>
                  <strong>{pageCount ?? "—"}</strong>
                </div>
                <div className="detail-row">
                  <span>Uploaded:</span>
                  <strong>
                    {new Date().toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Format:</span>
                  <strong>PDF</strong>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p>No file selected</p>
            <span>Upload a PDF to see details here</span>
          </div>
        )}
      </div>
    </div>
  );
};
