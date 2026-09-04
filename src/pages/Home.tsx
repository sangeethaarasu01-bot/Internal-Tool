import { useState } from "react";
import { PageHeader } from "../components/Header/PageHeader";
import { FileUpload } from "../components/FileUpload/FileUpload";
import { ConversionStatus } from "../components/Conversion/ConversionStatus";
import { Footer } from "../components/Layout/Footer";
import {
  downloadXmlFile,
  pollConversion,
  startConversion,
} from "../services/api";

export const Home = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<
    "idle" | "uploading" | "converting" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Your file is ready. Click convert to start.",
  );
  const [xmlContent, setXmlContent] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setConversionStatus("idle");
    setStatusMessage("Your file is ready. Click convert to start.");
    setXmlContent(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setConversionStatus("idle");
    setStatusMessage("Your file is ready. Click convert to start.");
    setXmlContent(null);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setConversionStatus("error");
      setStatusMessage("Please select a PDF first");
      return;
    }

    setXmlContent(null);

    try {
      setConversionStatus("uploading");
      setStatusMessage("Uploading your IEEE paper...");

      const started = await startConversion(selectedFile);

      setConversionStatus("converting");
      setStatusMessage("Extracting title, authors, abstract, sections, and references...");

      const result = await pollConversion(started.conversion_id, (record) => {
        if (record.status === "processing") {
          setStatusMessage("Generating IEEE JATS XML structure...");
        }
      });

      if (result.status === "failed") {
        throw new Error(result.error_message || "Conversion failed");
      }

      setXmlContent(result.xml_content || "");
      setConversionStatus("success");
      setStatusMessage(
        result.title
          ? `Ready: ${result.title}`
          : "Your IEEE XML file is ready for download.",
      );
    } catch (error) {
      setConversionStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Conversion failed. Please try again.",
      );
    }
  };

  const handleDownload = () => {
    if (!selectedFile || !xmlContent) return;
    downloadXmlFile(selectedFile.name, xmlContent);
  };

  return (
    <>
      <PageHeader />

      <section className="card upload-card">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onRemove={handleRemoveFile}
        />
      </section>

      <section className="card conversion-card">
        <div className="conversion-content">
          <h2>Convert to IEEE XML</h2>
          <p>
            Upload an IEEE PDF. The converter maps it into JATS article XML
            (front, body, back, refs).
          </p>

          <button
            className="convert-button"
            onClick={handleConvert}
            disabled={
              !selectedFile ||
              conversionStatus === "uploading" ||
              conversionStatus === "converting"
            }
          >
            {conversionStatus === "uploading" ||
            conversionStatus === "converting" ? (
              <>Processing...</>
            ) : (
              <>Convert Now</>
            )}
          </button>
        </div>

        <ConversionStatus
          status={conversionStatus}
          message={statusMessage}
          onDownload={xmlContent ? handleDownload : undefined}
        />
      </section>

      <Footer />
    </>
  );
};
