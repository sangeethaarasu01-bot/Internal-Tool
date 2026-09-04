const API_BASE = import.meta.env.VITE_API_URL || "";

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

export async function listConversions(status?: string): Promise<ConversionRecord[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/conversions${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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
  const blob = new Blob([xml], { type: "application/xml" });
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
