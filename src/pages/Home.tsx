import { useState } from "react";
import { PageHeader } from "../components/Header/PageHeader";
import { FileUpload } from "../components/FileUpload/FileUpload";
import { ConversionStatus } from "../components/Conversion/ConversionStatus";
import { LegacyPipelineBanner } from "../components/Hybrid/LegacyPipelineBanner";
import { Footer } from "../components/Layout/Footer";

export const Home = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <PageHeader />

      <LegacyPipelineBanner />

      <section className="card upload-card">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onRemove={handleRemoveFile}
        />
      </section>

      <section className="card conversion-card conversion-card--disabled">
        <div className="conversion-content">
          <h2>Convert to IEEE XML (legacy)</h2>
          <p>
            This flow used the old hardcoded JATS generator. It is disabled while
            the Hybrid AI pipeline (IR → scope → LLM mapper → template XML) is
            built.
          </p>

          <button className="convert-button" type="button" disabled>
            Legacy conversion disabled
          </button>
        </div>

        <ConversionStatus
          status="error"
          message="Use Document Extraction for Stage 1 IR, then Phase 2 for scoped XML."
        />
      </section>

      <Footer />
    </>
  );
};
