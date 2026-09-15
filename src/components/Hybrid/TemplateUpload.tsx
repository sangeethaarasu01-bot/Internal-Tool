import { FileCode2, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { formatFileSize } from "../../utils/pdfFile";
import { isXmlFile } from "../../utils/xmlFile";

interface TemplateUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const TemplateUpload = ({
  selectedFile,
  onFileSelect,
  onRemove,
  disabled = false,
}: TemplateUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    if (!isXmlFile(file)) {
      window.alert("Please select a valid XML template file (.xml)");
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="template-upload">
      <div className="template-upload__header">
        <div>
          <h3>IEEE JATS template XML</h3>
          <p>Optional reference template for schema-driven output (Phase 2).</p>
        </div>
      </div>

      {selectedFile ? (
        <div className="template-upload__selected">
          <div className="template-upload__file">
            <FileCode2 size={22} />
            <div>
              <strong>{selectedFile.name}</strong>
              <span>{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
          <button
            type="button"
            className="remove-file-btn"
            onClick={onRemove}
            disabled={disabled}
            title="Remove template"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ) : (
        <div
          className={`template-upload__drop ${isDragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            acceptFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload size={28} />
          <p>Drop template XML here or browse</p>
          <input
            type="file"
            id="template-xml-input"
            accept=".xml,application/xml,text/xml"
            disabled={disabled}
            style={{ display: "none" }}
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />
          <label htmlFor="template-xml-input" className="browse-button">
            Browse template
          </label>
        </div>
      )}

      <p className="template-upload__help">
        Template uploads to <code>POST /api/extractions/:id/template</code> after extraction
        completes.
      </p>
    </div>
  );
};
