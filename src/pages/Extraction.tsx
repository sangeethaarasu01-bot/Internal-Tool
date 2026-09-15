import { useMemo, useState } from "react";
import { FileUpload } from "../components/FileUpload/FileUpload";
import { ConversionStatus } from "../components/Conversion/ConversionStatus";
import { Footer } from "../components/Layout/Footer";
import {
  getExtractionText,
  pollExtraction,
  startExtraction,
  type ExtractionResult,
} from "../services/api";

export const Extraction = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "converting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Select a PDF, then extract layout-aware text. This does not convert to XML.",
  );
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const previewText = useMemo(() => {
    if (!result) return "";
    return result.pages
      .map((page) => {
        const body = page.blocks.map((block) => block.text).join("\n");
        return `--- Page ${page.page_number} ---\n${body}`;
      })
      .join("\n\n");
  }, [result]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus("idle");
    setMessage("PDF selected. Click Extract Text to start Stage 1.");
    setResult(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setMessage(
      "Select a PDF, then extract layout-aware text. This does not convert to XML.",
    );
    setResult(null);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setStatus("error");
      setMessage("Please select a PDF first");
      return;
    }

    setResult(null);
    try {
      setStatus("uploading");
      setMessage("Uploading PDF for extraction...");
      const started = await startExtraction(selectedFile);
      setStatus("converting");
      setMessage("Extracting pages, blocks, lines, and spans...");
      const record = await pollExtraction(started.extraction_id);
      if (record.status === "failed") {
        throw new Error(record.error_message || "Extraction failed");
      }
      const text = await getExtractionText(started.extraction_id);
      setResult(text);
      setStatus("success");
      setMessage(
        `Extracted ${text.document.page_count} page(s). OCR required: ${
          text.document.requires_ocr ? "yes" : "no"
        }.`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Extraction failed. Please try again.",
      );
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>
            Stage 1 <span>Text Extraction</span>
          </h1>
          <p>
            Layout-aware PyMuPDF extraction only. Existing PDF to XML convert
            remains on Home.
          </p>
        </div>
      </header>

      <section className="card upload-card">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onRemove={handleRemoveFile}
        />
      </section>

      <section className="card conversion-card">
        <div className="conversion-content">
          <h2>Extract text and layout</h2>
          <p>
            Produces page / block / line / span JSON. No XML conversion is
            created.
          </p>
          <button
            className="convert-button"
            onClick={handleExtract}
            disabled={
              !selectedFile || status === "uploading" || status === "converting"
            }
          >
            {status === "uploading" || status === "converting"
              ? "Extracting..."
              : "Extract Text"}
          </button>
        </div>
        <ConversionStatus status={status} message={message} />
      </section>

      {result ? (
        <section className="card extraction-result-card">
          <div className="extraction-stats">
            <div>
              <span>Pages</span>
              <strong>{result.document.page_count}</strong>
            </div>
            <div>
              <span>Blocks</span>
              <strong>{result.stats.total_blocks}</strong>
            </div>
            <div>
              <span>Lines</span>
              <strong>{result.stats.total_lines}</strong>
            </div>
            <div>
              <span>Chars</span>
              <strong>{result.stats.total_chars}</strong>
            </div>
            <div>
              <span>OCR required</span>
              <strong>{result.document.requires_ocr ? "Yes" : "No"}</strong>
            </div>
            <div>
              <span>OCR applied</span>
              <strong>{result.document.ocr_applied ? "Yes" : "No"}</strong>
            </div>
          </div>

          <h3>Pages and blocks</h3>
          <div className="extraction-pages">
            {result.pages.map((page) => (
              <article key={page.page_number} className="extraction-page">
                <h4>
                  Page {page.page_number} · {page.text_char_count} chars ·{" "}
                  {page.blocks.length} blocks
                  {page.requires_ocr ? " · low text" : ""}
                </h4>
                <ul>
                  {page.blocks.slice(0, 8).map((block) => (
                    <li key={block.block_id}>
                      <code>{block.block_id}</code> [{block.type}]{" "}
                      {block.lines.length} line(s)
                      {block.text ? ` — ${block.text.slice(0, 90)}` : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h3>Extracted text</h3>
          <pre className="extraction-text">{previewText || "(no text)"}</pre>
        </section>
      ) : null}

      <Footer />
    </>
  );
};
