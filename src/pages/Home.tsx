import { useState } from "react";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { PageHeader } from "../components/Header/PageHeader";
import { FileUpload } from "../components/FileUpload/FileUpload";
import { ConversionStatus } from "../components/Conversion/ConversionStatus";
import { StepsCard } from "../components/Steps/StepsCard";
import { Footer } from "../components/Layout/Footer";

export const Home = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<
    "idle" | "uploading" | "converting" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Your file is ready. Click convert to start.",
  );
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 = idle

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setConversionStatus("idle");
    setStatusMessage("Your file is ready. Click convert to start.");
    setCurrentStep(-1);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setConversionStatus("idle");
    setStatusMessage("Your file is ready. Click convert to start.");
    setCurrentStep(-1);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setConversionStatus("error");
      setStatusMessage("Please select a file first");
      return;
    }

    try {
      // Step 0: Uploading
      setConversionStatus("uploading");
      setStatusMessage("Uploading your IEEE paper...");
      setCurrentStep(0);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 1: AI Processing
      setConversionStatus("converting");
      setStatusMessage("AI is extracting and structuring content...");
      setCurrentStep(1);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Generate XML
      setStatusMessage("Generating IEEE XML format...");
      setCurrentStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 3: Success
      setConversionStatus("success");
      setStatusMessage("Your IEEE XML file is ready for download! 🎉");
      setCurrentStep(3);
    } catch (error) {
      setConversionStatus("error");
      setStatusMessage("Conversion failed. Please try again.");
      setCurrentStep(-1);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        <PageHeader />

        {/* File Upload Section */}
        <section className="card upload-card">
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onRemove={handleRemoveFile}
          />
        </section>

        {/* Conversion Section */}
        <section className="card conversion-card">
          <div className="conversion-content">
            <h2>Convert to IEEE XML</h2>
            <p>Click the button below to start the conversion process.</p>

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
                <>⏳ Processing...</>
              ) : (
                <>Convert Now</>
              )}
            </button>
          </div>

          <ConversionStatus status={conversionStatus} message={statusMessage} />
        </section>

        {/* Steps Card - Shows progress */}
        <StepsCard currentStep={currentStep} />

        <Footer />
      </main>
    </div>
  );
};
