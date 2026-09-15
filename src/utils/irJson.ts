import type { SemanticDocument } from "../services/api";

export type DocumentScope = "front" | "body" | "back" | "full";

const EMPTY_FRONT = {
  journal_header: null,
  page_number: null,
  title: null,
  authors: [],
  affiliations: [],
  date_history: null,
  corresponding_author: null,
  abstract: null,
  keywords: null,
  other: [],
};

const EMPTY_BODY = {
  sections: [],
  loose_paragraphs: [],
};

const EMPTY_BACK = {
  reference_list: null,
  references: [],
  other: [],
};

export function buildIrPayload(semantic: SemanticDocument): Record<string, unknown> {
  return {
    pipeline_version: semantic.pipeline_version,
    front: semantic.front,
    body: semantic.body ?? EMPTY_BODY,
    back: semantic.back ?? EMPTY_BACK,
    unknown: semantic.unknown ?? [],
    completeness: semantic.completeness,
  };
}

/** Fallback preview only — authoritative filtering is server-side via scope API. */
export function filterIrPreview(
  ir: Record<string, unknown>,
  scope: DocumentScope,
): Record<string, unknown> {
  if (scope === "full") {
    return ir;
  }
  const filtered = { ...ir };
  if (scope === "front") {
    filtered.body = EMPTY_BODY;
    filtered.back = EMPTY_BACK;
    filtered.unknown = [];
  } else if (scope === "body") {
    filtered.front = EMPTY_FRONT;
    filtered.back = EMPTY_BACK;
    filtered.unknown = [];
  } else if (scope === "back") {
    filtered.front = EMPTY_FRONT;
    filtered.body = EMPTY_BODY;
    filtered.unknown = [];
  }
  return filtered;
}

export function countIrSections(ir: Record<string, unknown>): {
  front: number;
  body: number;
  back: number;
} {
  const front = ir.front as Record<string, unknown> | undefined;
  const body = ir.body as { sections?: unknown[]; loose_paragraphs?: unknown[] } | undefined;
  const back = ir.back as { references?: unknown[]; other?: unknown[]; reference_list?: unknown } | undefined;

  let frontCount = 0;
  if (front) {
    for (const value of Object.values(front)) {
      if (value == null) continue;
      if (Array.isArray(value)) frontCount += value.length;
      else if (typeof value === "object") frontCount += 1;
    }
  }

  let bodyCount = (body?.loose_paragraphs?.length ?? 0) + (body?.sections?.length ?? 0);
  let backCount =
    (back?.references?.length ?? 0) +
    (back?.other?.length ?? 0) +
    (back?.reference_list ? 1 : 0);

  return { front: frontCount, body: bodyCount, back: backCount };
}
