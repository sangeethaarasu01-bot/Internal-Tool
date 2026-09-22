import { resolveApiBaseUrl } from "../lib/apiBase";

const API_BASE = resolveApiBaseUrl();

export type ConversionStatusValue =
  | "pending"
  | "processing"
  | "completed"
  | "success"
  | "failed";

export interface ConversionRecord {
  id: string;
  filename: string;
  original_filename?: string;
  file_size: number;
  page_count?: number | null;
  status: ConversionStatusValue;
  xml_content?: string | null;
  error_message?: string | null;
  title?: string | null;
  doi?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ConvertResponse {
  message: string;
  conversion_id: string;
  filename: string;
  status: string;
}

export interface ConversionStats {
  total: number;
  success: number;
  failed: number;
  processing: number;
  pending?: number;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg).join(", ");
    }
    return data.message || res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

export function isConversionDone(status: string) {
  return status === "completed" || status === "success";
}

export async function startConversion(file: File): Promise<ConvertResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/conversions`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getConversion(id: string): Promise<ConversionRecord> {
  const res = await fetch(`${API_BASE}/api/conversions/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listConversions(
  status?: string,
  options?: { skip?: number; limit?: number },
): Promise<ConversionRecord[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  params.set("limit", String(options?.limit ?? 200));
  if (options?.skip) params.set("skip", String(options.skip));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/conversions?${qs}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getConversionStats(): Promise<ConversionStats> {
  const res = await fetch(`${API_BASE}/api/conversions/stats`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function retryConversion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/conversions/${id}/retry`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export function downloadXmlFile(filename: string, xml: string) {
  const cleaned = xml.replace(/^\uFEFF/, "");
  const blob = new Blob([cleaned], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\.pdf$/i, ".xml");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollConversion(
  id: string,
  onTick?: (record: ConversionRecord) => void,
): Promise<ConversionRecord> {
  for (let i = 0; i < 90; i += 1) {
    const record = await getConversion(id);
    onTick?.(record);
    if (isConversionDone(record.status) || record.status === "failed") {
      return record;
    }
    await sleep(1000);
  }
  throw new Error("Conversion timed out. Check conversion history.");
}

export type ExtractionStatusValue = "queued" | "processing" | "completed" | "failed";

export type DocumentScope = "front" | "body" | "back" | "full";

export interface ExtractionRecord {
  extraction_id: string;
  document_id?: string;
  filename: string;
  original_filename?: string;
  status: ExtractionStatusValue;
  page_count?: number | null;
  requires_ocr?: boolean | null;
  ocr_applied?: boolean;
  error_message?: string | null;
  scope?: DocumentScope;
  template_id?: string | null;
}

export interface ScopeResponse {
  document_id: string;
  scope: DocumentScope;
  allowed_sections: string[];
  filtered_ir: Record<string, unknown>;
  filtered_template_schema?: Record<string, unknown> | null;
  dropped_element_count: number;
  warnings: string[];
}

export interface TemplateUploadResponse {
  document_id: string;
  template_id: string;
  original_filename: string;
  created_at: string;
  schema: Record<string, unknown>;
}

export interface TextSpan {
  text: string;
  bbox: number[];
  font?: string | null;
  size?: number | null;
  flags?: number | null;
}

export interface TextLine {
  line_id: string;
  bbox: number[];
  text: string;
  spans: TextSpan[];
}

export interface TextBlock {
  block_id: string;
  type: string;
  bbox: number[];
  text: string;
  lines: TextLine[];
}

export interface PageExtraction {
  page_number: number;
  width: number;
  height: number;
  text_char_count: number;
  requires_ocr: boolean;
  blocks: TextBlock[];
}

export interface SemanticElement {
  type: string;
  tag: string;
  text: string;
  source_block_ids: string[];
  page_numbers: number[];
  bbox?: number[] | null;
  confidence: number;
  children?: SemanticElement[];
  keywords?: string[];
  heading?: string | null;
}

export interface SemanticSection {
  heading: string;
  heading_element?: SemanticElement | null;
  level?: number;
  paragraphs?: SemanticElement[];
  subsections?: SemanticSection[];
  content?: SemanticElement[];
  content_source_block_ids?: string[];
}

export interface SemanticDocument {
  pipeline_version: string;
  tagged_output?: string;
  completeness: {
    raw_character_count: number;
    structured_character_count: number;
    excluded_character_count: number;
    unknown_element_count: number;
    unmapped_block_ids: string[];
  };
  front: {
    title?: SemanticElement | null;
    authors: SemanticElement[];
    affiliations: SemanticElement[];
    abstract?: SemanticElement | null;
    keywords?: SemanticElement | null;
    journal_header?: SemanticElement | null;
    page_number?: SemanticElement | null;
    date_history?: SemanticElement | null;
    corresponding_author?: SemanticElement | null;
    other?: SemanticElement[];
  };
  body?: {
    sections: SemanticSection[];
    loose_paragraphs: SemanticElement[];
  };
  back?: {
    reference_list?: SemanticElement | null;
    references: SemanticElement[];
    other: SemanticElement[];
  };
  unknown?: SemanticElement[];
}

export interface DocumentStructure {
  pipeline_version: string;
  semantic?: SemanticDocument | null;
}

export interface ExtractionResult {
  document: {
    filename: string;
    page_count: number;
    requires_ocr: boolean;
    ocr_applied: boolean;
    extraction_engine: string;
    extraction_version: string;
    metadata: {
      title?: string | null;
      author?: string | null;
      creator?: string | null;
      producer?: string | null;
    };
  };
  pages: PageExtraction[];
  stats: {
    total_blocks: number;
    total_lines: number;
    total_chars: number;
    pages_with_low_text: number[];
    pages_with_no_text: number[];
  };
  structure?: DocumentStructure | null;
}

export async function startExtraction(file: File): Promise<{
  extraction_id: string;
  status: string;
  filename: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/extractions`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getExtraction(id: string): Promise<ExtractionRecord> {
  const res = await fetch(`${API_BASE}/api/extractions/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getExtractionText(id: string): Promise<ExtractionResult> {
  const res = await fetch(`${API_BASE}/api/extractions/${id}/text`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function pollExtraction(
  id: string,
  onTick?: (record: ExtractionRecord) => void,
): Promise<ExtractionRecord> {
  for (let i = 0; i < 90; i += 1) {
    const record = await getExtraction(id);
    onTick?.(record);
    if (record.status === "completed" || record.status === "failed") {
      return record;
    }
    await sleep(1000);
  }
  throw new Error("Extraction timed out.");
}

export async function uploadExtractionTemplate(
  extractionId: string,
  file: File,
): Promise<TemplateUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/extractions/${extractionId}/template`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function applyExtractionScope(
  extractionId: string,
  scope: DocumentScope,
): Promise<ScopeResponse> {
  const res = await fetch(`${API_BASE}/api/extractions/${extractionId}/scope`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export interface GenerateXmlResponse {
  document_id: string;
  scope: DocumentScope;
  mapping_source: string;
  prompt_version?: string | null;
  xml_content: string;
  warnings: string[];
  unmapped_content_count: number;
}

export async function generateExtractionXml(
  extractionId: string,
  options?: { scope?: DocumentScope; useLlm?: boolean; llmFallback?: boolean },
): Promise<GenerateXmlResponse> {
  const res = await fetch(`${API_BASE}/api/extractions/${extractionId}/generate-xml`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: options?.scope ?? "full",
      use_llm: options?.useLlm ?? false,
      llm_fallback: options?.llmFallback ?? true,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function semanticMapExtraction(
  extractionId: string,
  scope: DocumentScope = "full",
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/extractions/${extractionId}/semantic-map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
