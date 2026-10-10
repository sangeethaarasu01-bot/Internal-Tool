import { useMemo, useState } from "react";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import {
  ExtractionStatus,
  type ExtractionUiStatus,
} from "../../components/FileUpload/ExtractionStatus";
import { IrJsonViewer } from "../../components/Hybrid/IrJsonViewer";
import { ScopeSelector } from "../../components/Hybrid/ScopeSelector";
import { TemplateUpload } from "../../components/Hybrid/TemplateUpload";
import { Footer } from "../../components/Layout/Footer";
import {
  applyExtractionScope,
  clearExtractionTemplate,
  createTemplateFromSource,
  downloadXmlFile,
  generateExtractionXml,
  getExtractionText,
  pollExtraction,
  startExtraction,
  uploadExtractionTemplate,
  type DocumentScope as ApiDocumentScope,
  type ExtractionResult,
  type GenerateXmlResponse,
  type OutputFormat,
  type PageExtraction,
  type TemplateUploadResponse,
  type TextBlock,
} from "../../services/api";
import { TaggedBlockList } from "../../components/DocumentExtraction/TaggedBlockList";
import { classifyBlockColumn } from "../../utils/layoutColumn";
import { saveExtractionHistoryEntry } from "../../utils/extractionHistory";
import { formatXmlOutput, type TagLevel } from "../../utils/formatTaggedOutput";
import { buildIrPayload, type DocumentScope } from "../../utils/irJson";

type ResultTab = "overview" | "text" | "layout" | "pages" | "ir_json" | "final_xml";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function describeMappingSource(source: string): string {
  if (source === "ir_adapter" || source === "ir_adapter_fallback") {
    return "Heuristic mapping (no LLM)";
  }
  if (source.startsWith("cached")) {
    return "Cached mapping";
  }
  if (source === "llm") {
    return "LLM semantic mapping";
  }
  return source;
}

function LayoutBlockCard({
  block,
  page,
}: {
  block: TextBlock;
  page: PageExtraction;
}) {
  const column = classifyBlockColumn(block.bbox, page.width);
  return (
    <article className={`layout-block layout-block--${column.toLowerCase().replace("_", "-")}`}>
      <div className="layout-block__meta">
        <code>{block.block_id}</code>
        <span className="layout-block__column">{column.replace("_", " ")}</span>
        <span className="layout-block__type">{block.type}</span>
      </div>
      <div className="layout-block__bbox">
        bbox: [{block.bbox.map((v) => v.toFixed(2)).join(", ")}]
      </div>
      <p className="layout-block__text">{block.text || "(empty)"}</p>
    </article>
  );
}

export const DocumentExtraction = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [scope, setScope] = useState<DocumentScope>("full");
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateFormat, setTemplateFormat] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [scopedIr, setScopedIr] = useState<Record<string, unknown> | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [status, setStatus] = useState<ExtractionUiStatus>("idle");
  const [message, setMessage] = useState(
    "Upload a PDF, then click Extract Text. Upload alone does not start extraction.",
  );
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("text");
  const [selectedPage, setSelectedPage] = useState(1);
  const [tagLevel, setTagLevel] = useState<TagLevel>("blocks");
  const [useLlm, setUseLlm] = useState(false);
  const [skipTablesFigures, setSkipTablesFigures] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templateBinding, setTemplateBinding] = useState(false);
  const [generatedXml, setGeneratedXml] = useState<GenerateXmlResponse | null>(null);
  const [pollProgress, setPollProgress] = useState<number | null>(null);
  const [pollStep, setPollStep] = useState<string | null>(null);

  const isBusy =
    status === "uploading" ||
    status === "extracting" ||
    scopeLoading ||
    generating ||
    templateBinding;

  const applyTemplateUpload = (templateResponse: TemplateUploadResponse) => {
    setTemplateId(templateResponse.template_id);
    const schema = templateResponse.schema as { template_format?: string; root_tag?: string };
    const fmt =
      schema.template_format ??
      (schema.root_tag === "book" ? "docbook_5_book" : "ieee_jats_article");
    setTemplateFormat(fmt);
    setOutputFormat(fmt === "docbook_5_book" ? "docbook_5" : "auto");
  };

  const handleTemplateFromSource = async () => {
    if (!extractionId) {
      setMessage("Run extraction first.");
      return;
    }
    setTemplateBinding(true);
    setMessage("Clearing prior template and building DocBook skeleton from this PDF's metadata…");
    try {
      await clearExtractionTemplate(extractionId);
      const templateResponse = await createTemplateFromSource(extractionId);
      applyTemplateUpload(templateResponse);
      setGeneratedXml(null);
      setMessage(
        "Template bound from Phase 1 metadata for this job only. Generate XML when ready.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Template from source failed.");
    } finally {
      setTemplateBinding(false);
    }
  };

  const handleClearTemplate = async () => {
    if (!extractionId) return;
    setTemplateBinding(true);
    try {
      await clearExtractionTemplate(extractionId);
      setTemplateId(null);
      setTemplateFormat(null);
      setGeneratedXml(null);
      setMessage("Template cleared for this extraction. Upload XML or generate from PDF metadata.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not clear template.");
    } finally {
      setTemplateBinding(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTemplateFile(null);
    setStatus("idle");
    setMessage("PDF selected. Click Extract Text to run Stage 1 extraction.");
    setResult(null);
    setExtractionId(null);
    setTemplateId(null);
    setTemplateFormat(null);
    setOutputFormat("auto");
    setScopedIr(null);
    setGeneratedXml(null);
    setActiveTab("text");
    setSelectedPage(1);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setMessage(
      "Upload a PDF, then click Extract Text. Upload alone does not start extraction.",
    );
    setResult(null);
    setExtractionId(null);
    setTemplateId(null);
    setTemplateFormat(null);
    setOutputFormat("auto");
    setScopedIr(null);
    setGeneratedXml(null);
    setSelectedPage(1);
  };

  const refreshScope = async (id: string, nextScope: ApiDocumentScope) => {
    setScopeLoading(true);
    try {
      const response = await applyExtractionScope(id, nextScope);
      setScopedIr(response.filtered_ir);
      setScope(response.scope as DocumentScope);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scope request failed.");
    } finally {
      setScopeLoading(false);
    }
  };

  const handleScopeChange = async (nextScope: DocumentScope) => {
    if (!extractionId) {
      setScope(nextScope);
      return;
    }
    await refreshScope(extractionId, nextScope);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setStatus("failed");
      setMessage("Please select a PDF first.");
      return;
    }

    setResult(null);
    setPollProgress(null);
    setPollStep(null);
    try {
      setStatus("uploading");
      setMessage("Uploading PDF to extraction service...");
      const started = await startExtraction(selectedFile);

      setStatus("extracting");
      setMessage("Running Stage 1 layout-aware text extraction...");
      const record = await pollExtraction(started.extraction_id, (tick) => {
        if (tick.progress != null) setPollProgress(tick.progress);
        if (tick.current_step) setPollStep(tick.current_step);
        if (tick.status === "queued") {
          setMessage("Waiting for extraction worker…");
        } else if (tick.status === "processing") {
          setMessage(tick.current_step ?? "Extracting pages, blocks, lines, and spans…");
        }
      });

      if (record.status === "failed") {
        throw new Error(record.error_message || "Extraction failed");
      }

      const text = await getExtractionText(started.extraction_id);
      setResult(text);
      setExtractionId(started.extraction_id);

      if (templateFile) {
        setMessage("Uploading XML template...");
        const templateResponse = await uploadExtractionTemplate(
          started.extraction_id,
          templateFile,
        );
        applyTemplateUpload(templateResponse);
      }

      setMessage("Applying scope filter...");
      const scopeResponse = await applyExtractionScope(started.extraction_id, scope);
      setScopedIr(scopeResponse.filtered_ir);
      setScope(scopeResponse.scope as DocumentScope);

      setStatus("completed");
      setMessage("Extraction complete. Template and scope are associated with this document.");
      setActiveTab("ir_json");
      setSelectedPage(1);

      saveExtractionHistoryEntry({
        extraction_id: started.extraction_id,
        filename: selectedFile.name,
        created_at: new Date().toISOString(),
        page_count: text.document.page_count,
        status: "completed",
      });
    } catch (error) {
      setStatus("failed");
      setMessage(
        error instanceof Error ? error.message : "Extraction failed. Please try again.",
      );
    }
  };

  const selectedPageData = useMemo(
    () => result?.pages.find((page) => page.page_number === selectedPage) ?? null,
    [result, selectedPage],
  );

  const semanticTaggedOutput = result?.structure?.semantic?.tagged_output ?? "";

  const irPayload = useMemo(() => {
    const semantic = result?.structure?.semantic;
    if (!semantic) return null;
    return buildIrPayload(semantic);
  }, [result]);

  const xmlOutputContent = useMemo(() => {
    if (!result) return "";
    return formatXmlOutput(result, semanticTaggedOutput, tagLevel);
  }, [result, semanticTaggedOutput, tagLevel]);

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.document.filename.replace(/\.pdf$/i, "")}.extraction.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPreviewXml = () => {
    if (!result || !xmlOutputContent) return;
    const blob = new Blob([xmlOutputContent.replace(/^\uFEFF/, "")], {
      type: "application/xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.document.filename.replace(/\.pdf$/i, "")}.preview.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateXml = async () => {
    if (!extractionId) {
      setMessage("Run extraction first.");
      return;
    }
    if (!templateId) {
      setMessage("Upload a template XML before generating output.");
      return;
    }
    setGenerating(true);
    setMessage(
      useLlm
        ? "Running LLM semantic mapping (may take 2–5 minutes for large PDFs)..."
        : "Generating XML from template...",
    );
    try {
      const response = await generateExtractionXml(extractionId, {
        scope: scope as ApiDocumentScope,
        useLlm,
        llmFallback: true,
        outputFormat,
      });
      setGeneratedXml(response);
      setActiveTab("final_xml");
      setStatus("completed");
      const modeLabel = describeMappingSource(response.mapping_source);
      const warning =
        response.warnings.find((w) => !w.toLowerCase().includes("api key")) ??
        response.warnings[0];
      setMessage(
        `XML generated (${response.output_format}) — ${modeLabel}.${warning ? ` ${warning}` : ""}`.trim(),
      );
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "XML generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadFinalXml = () => {
    if (!result || !generatedXml?.xml_content) return;
    downloadXmlFile(result.document.filename, generatedXml.xml_content);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>
            Document <span>Extraction</span>
          </h1>
          <p>
            Upload PDF + template XML → extract content → generate downloadable IEEE JATS XML.
            Uses heuristic mapping by default (no API keys). Optional LLM toggle below.
          </p>
        </div>
      </header>

      <section className="card upload-card">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onRemove={handleRemoveFile}
          pageCount={result?.document.page_count ?? null}
        />
      </section>

      <section className="card hybrid-options-card">
        <div className="hybrid-options-grid">
          <ScopeSelector value={scope} onChange={handleScopeChange} disabled={isBusy} />
          <TemplateUpload
            selectedFile={templateFile}
            onFileSelect={setTemplateFile}
            onRemove={() => setTemplateFile(null)}
            disabled={isBusy}
          />
        </div>
      </section>

      <section className="card conversion-card">
        <div className="conversion-content">
          <h2>Extract text and layout</h2>
          <p>
            Sends the PDF to <code>POST /api/extractions</code> only when you
            click Extract Text.
          </p>
          <button
            className="convert-button"
            onClick={handleExtract}
            disabled={!selectedFile || isBusy}
          >
            {status === "uploading" || status === "extracting" ? "Extracting..." : "Extract Text"}
          </button>
        </div>
        <ExtractionStatus
          status={status}
          message={message}
          progress={pollProgress}
          currentStep={pollStep}
        />
      </section>

      {extractionId ? (
        <section className="card conversion-card">
          <div className="conversion-content">
            <h2>Template binding</h2>
            <p>
              Sample XML may come from another publication; book-level metadata in the output is
              taken from this PDF after generation. Clear the template to upload a different file.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                type="button"
                className="convert-button"
                onClick={handleTemplateFromSource}
                disabled={isBusy}
              >
                {templateBinding ? "Binding…" : "Generate template from PDF metadata"}
              </button>
              {templateId ? (
                <button
                  type="button"
                  className="convert-button"
                  onClick={handleClearTemplate}
                  disabled={isBusy}
                  style={{ opacity: 0.9 }}
                >
                  Clear template
                </button>
              ) : null}
            </div>
            {templateId ? (
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Bound template: <code>{templateId}</code>
                {templateFormat ? ` (${templateFormat})` : ""}
              </p>
            ) : (
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                No template bound yet — upload XML above or generate from PDF metadata.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {extractionId && templateId ? (
        <section className="card conversion-card">
          <div className="conversion-content">
            <h2>Generate XML</h2>
            <p>
              {templateFormat === "docbook_5_book"
                ? "DocBook 5.0 book templates export as DocBook XML (template structure preserved). IEEE JATS applies to article templates only."
                : "Article templates use IEEE JATS generation with extracted content. Turn on LLM for per-client template mapping."}
            </p>
            <label className="hybrid-llm-toggle" style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ marginRight: "0.5rem" }}>Output format:</span>
              <select
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                disabled={isBusy || templateFormat === "docbook_5_book"}
              >
                <option value="auto">Auto (from template)</option>
                {templateFormat !== "docbook_5_book" ? (
                  <option value="ieee_jats">IEEE JATS XML</option>
                ) : null}
                {templateFormat === "docbook_5_book" ? (
                  <option value="docbook_5">DocBook 5.0</option>
                ) : null}
              </select>
            </label>
            <label className="hybrid-llm-toggle">
              <input
                type="checkbox"
                checked={useLlm}
                onChange={(event) => setUseLlm(event.target.checked)}
                disabled={isBusy}
              />
              Use LLM semantic mapping (optional — requires API key on backend)
            </label>
            <button
              className="convert-button"
              onClick={handleGenerateXml}
              disabled={isBusy}
            >
              {generating ? "Generating..." : "Generate IEEE XML"}
            </button>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="card extraction-result-card">
          <div className="extraction-complete-banner">
            <h2>Extraction Complete</h2>
            <p>{result.document.filename}</p>
          </div>

          <div className="extraction-stats">
            <div>
              <span>Pages</span>
              <strong>{formatNumber(result.document.page_count)}</strong>
            </div>
            <div>
              <span>Text Blocks</span>
              <strong>{formatNumber(result.stats.total_blocks)}</strong>
            </div>
            <div>
              <span>Lines</span>
              <strong>{formatNumber(result.stats.total_lines)}</strong>
            </div>
            <div>
              <span>Characters</span>
              <strong>{formatNumber(result.stats.total_chars)}</strong>
            </div>
            <div>
              <span>OCR Required</span>
              <strong>{result.document.requires_ocr ? "Yes" : "No"}</strong>
            </div>
            <div>
              <span>Extraction Engine</span>
              <strong>{result.document.extraction_engine}</strong>
            </div>
          </div>

          <div className="extraction-result-actions">
            {generatedXml ? (
              <button type="button" className="browse-button" onClick={handleDownloadFinalXml}>
                Download IEEE XML
              </button>
            ) : null}
            <button type="button" className="browse-button" onClick={handleDownloadPreviewXml}>
              Download Preview XML
            </button>
            <button type="button" className="browse-button" onClick={handleDownloadJson}>
              Download JSON
            </button>
          </div>

          <div className="extraction-tabs">
            {(
              [
                ["ir_json", "IR JSON"],
                ["final_xml", "IEEE JATS XML"],
                ["text", "Preview XML"],
                ["pages", "Pages"],
                ["layout", "Layout"],
                ["overview", "Overview"],
              ] as [ResultTab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={`extraction-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "ir_json" ? (
            <div className="extraction-tab-panel">
              {irPayload ? (
                <IrJsonViewer
                  filteredIr={scopedIr ?? irPayload}
                  fullIr={irPayload}
                  scope={scope}
                  serverScoped={scopedIr !== null}
                />
              ) : (
                <p className="tagged-help">
                  No semantic IR was returned for this extraction. Re-run extraction
                  or check backend Stage 1 output.
                </p>
              )}
            </div>
          ) : null}

          {activeTab === "final_xml" ? (
            <div className="extraction-tab-panel">
              {generatedXml?.xml_content ? (
                <>
                  <p className="tagged-help">
                    Mapping source: <strong>{generatedXml.mapping_source}</strong>
                    {generatedXml.prompt_version
                      ? ` · prompt ${generatedXml.prompt_version}`
                      : ""}
                  </p>
                  <pre className="tagged-xml-output">{generatedXml.xml_content}</pre>
                </>
              ) : (
                <p className="tagged-help">
                  Click <strong>Generate IEEE XML</strong> after uploading a template to
                  produce downloadable JATS output.
                </p>
              )}
            </div>
          ) : null}

          {activeTab === "overview" ? (
            <div className="extraction-tab-panel">
              <h3>Document overview</h3>
              <ul className="extraction-overview-list">
                <li>
                  <strong>Document ID:</strong> {extractionId || "—"}
                </li>
                <li>
                  <strong>Template ID:</strong> {templateId || "—"}
                </li>
                <li>
                  <strong>Scope:</strong> {scope}
                </li>
                <li>
                  <strong>Title:</strong> {result.document.metadata.title || "—"}
                </li>
                <li>
                  <strong>Author:</strong> {result.document.metadata.author || "—"}
                </li>
                <li>
                  <strong>Engine version:</strong> {result.document.extraction_version}
                </li>
                <li>
                  <strong>OCR applied:</strong>{" "}
                  {result.document.ocr_applied ? "Yes" : "No"}
                </li>
                <li>
                  <strong>Pages with low text:</strong>{" "}
                  {result.stats.pages_with_low_text.length
                    ? result.stats.pages_with_low_text.join(", ")
                    : "None"}
                </li>
              </ul>
              <h3>Page summary</h3>
              <div className="extraction-pages">
                {result.pages.map((page) => (
                  <article key={page.page_number} className="extraction-page">
                    <h4>
                      Page {page.page_number} · {page.blocks.length} blocks ·{" "}
                      {formatNumber(page.text_char_count)} chars
                    </h4>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "text" ? (
            <div className="extraction-tab-panel">
              <div className="tag-level-picker">
                <span>Tag level:</span>
                {(
                  [
                    ["blocks", "Blocks"],
                    ["lines", "Lines"],
                    ["spans", "Spans"],
                  ] as [TagLevel, string][]
                ).map(([level, label]) => (
                  <button
                    key={level}
                    type="button"
                    className={`page-picker__btn ${tagLevel === level ? "active" : ""}`}
                    onClick={() => setTagLevel(level)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="tagged-help">
                Semantic tags reflect content type (title, author, abstract, section,
                paragraph, reference), not one PDF block = one <code>&lt;p&gt;</code>.
                Source block IDs are preserved on each element.
              </p>
              {!semanticTaggedOutput ? (
                result.pages.map((page) => (
                  <section key={page.page_number} className="tagged-page-section">
                    <h3>Page {page.page_number}</h3>
                    <TaggedBlockList page={page} blocks={page.blocks} level={tagLevel} />
                  </section>
                ))
              ) : null}
              <h3>Semantic tagged output</h3>
              <pre className="extraction-text">{xmlOutputContent}</pre>
            </div>
          ) : null}

          {activeTab === "layout" ? (
            <div className="extraction-tab-panel">
              {result.pages.map((page) => (
                <section key={page.page_number} className="layout-page-section">
                  <h3>Page {page.page_number}</h3>
                  <div className="layout-blocks">
                    {page.blocks.map((block) => (
                      <LayoutBlockCard key={block.block_id} block={block} page={page} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {activeTab === "pages" ? (
            <div className="extraction-tab-panel extraction-pages-tab">
              <div className="page-picker">
                {result.pages.map((page) => (
                  <button
                    key={page.page_number}
                    type="button"
                    className={`page-picker__btn ${
                      selectedPage === page.page_number ? "active" : ""
                    }`}
                    onClick={() => setSelectedPage(page.page_number)}
                  >
                    Page {page.page_number}
                  </button>
                ))}
              </div>
              {selectedPageData ? (
                <div className="page-detail">
                  <h3>
                    Page {selectedPageData.page_number} · {selectedPageData.blocks.length}{" "}
                    blocks
                  </h3>
                  <TaggedBlockList
                    page={selectedPageData}
                    blocks={selectedPageData.blocks}
                    level={tagLevel}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <Footer />
    </>
  );
};
