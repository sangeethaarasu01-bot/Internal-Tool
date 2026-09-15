export interface ExtractionHistoryEntry {
  extraction_id: string;
  filename: string;
  created_at: string;
  page_count?: number | null;
  status: string;
}

const STORAGE_KEY = "stage1_extraction_history";

export function loadExtractionHistory(): ExtractionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExtractionHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExtractionHistoryEntry(entry: ExtractionHistoryEntry): void {
  const existing = loadExtractionHistory().filter(
    (item) => item.extraction_id !== entry.extraction_id,
  );
  const next = [entry, ...existing].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
