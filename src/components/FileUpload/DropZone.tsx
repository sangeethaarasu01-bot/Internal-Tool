import { Upload } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone = ({ onFileSelect }: DropZoneProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="drop-zone">
      <div className="upload-icon">
        <Upload size={35} />
      </div>

      <h3>Drag & drop your IEEE PDF here</h3>

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
  );
};
