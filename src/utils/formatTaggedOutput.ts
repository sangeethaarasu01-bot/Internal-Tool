import type { ExtractionResult, PageExtraction, TextBlock } from "../services/api";
import { classifyBlockColumn } from "./layoutColumn";
import { escapeForXmlSerialization, serializeXmlStringWithHexQuoteEntities } from "./xmlSerializer";

export type TagLevel = "blocks" | "lines" | "spans";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blockTag(block: TextBlock): string {
  if (block.type === "image") return "div";
  return "p";
}

function attrs(
  className: string,
  extra: Record<string, string | number | undefined> = {},
): string {
  const parts = [`class="${className}"`];
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") {
      parts.push(`data-${key}="${value}"`);
    }
  }
  return parts.join(" ");
}

export function formatHtmlBlock(block: TextBlock, page: PageExtraction): string {
  const tag = blockTag(block);
  const column = classifyBlockColumn(block.bbox, page.width);
  const content = escapeHtml(block.text || "");
  const attributeString = attrs(block.block_id, {
    page: page.page_number,
    column: column.toLowerCase(),
    type: block.type,
  });
  return `<${tag} ${attributeString}>${content}</${tag}>`;
}

export function formatHtmlLine(block: TextBlock, page: PageExtraction): string {
  return block.lines
    .map((line) => {
      const content = escapeHtml(line.text || "");
      const attributeString = attrs(line.line_id, {
        page: page.page_number,
        block: block.block_id,
      });
      return `<p ${attributeString}>${content}</p>`;
    })
    .join("\n");
}

export function formatHtmlSpan(block: TextBlock, page: PageExtraction): string {
  return block.lines
    .map((line) => {
      const spans = line.spans
        .map((span, index) => {
          const spanClass = `${line.line_id}_s${index}`;
          const font = span.font ? ` data-font="${escapeHtml(span.font)}"` : "";
          const size = span.size ? ` data-size="${span.size}"` : "";
          return `<span class="${spanClass}"${font}${size}>${escapeHtml(span.text)}</span>`;
        })
        .join("");
      const attributeString = attrs(line.line_id, {
        page: page.page_number,
        block: block.block_id,
      });
      return `<p ${attributeString}>${spans}</p>`;
    })
    .join("\n");
}

export function formatHtmlPage(page: PageExtraction, level: TagLevel): string {
  const blocks = page.blocks.map((block) => {
    if (level === "lines") return formatHtmlLine(block, page);
    if (level === "spans") return formatHtmlSpan(block, page);
    return formatHtmlBlock(block, page);
  });

  return `<!-- page ${page.page_number} -->\n<section class="page-${page.page_number}" data-page="${page.page_number}">\n${blocks.join("\n")}\n</section>`;
}

export function formatHtmlDocument(
  result: ExtractionResult,
  level: TagLevel,
): string {
  const body = result.pages
    .map((page) => formatHtmlPage(page, level))
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(result.document.filename)}</title>
</head>
<body data-filename="${escapeHtml(result.document.filename)}">
${body}
</body>
</html>`;
}

/** Plain snippet without full HTML document wrapper (for inline preview). */
export function formatHtmlSnippet(
  result: ExtractionResult,
  level: TagLevel,
): string {
  return result.pages
    .map((page) => formatHtmlPage(page, level))
    .join("\n\n");
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

// XML 1.0 forbids most C0 control characters (tab, LF, CR are allowed).
const ILLEGAL_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g;

function sanitizeXmlText(text: string): string {
  return text.replace(ILLEGAL_XML_CHARS, "");
}

/**
 * Tagged XML for preview and download (same string in both places).
 * Prefers Stage 1 semantic tagged output; falls back to block-level tags.
 * Quote hex entities are applied only at this final serialization step.
 */
export function formatXmlOutput(
  result: ExtractionResult,
  semanticTaggedOutput: string,
  level: TagLevel = "blocks",
): string {
  const tagged = sanitizeXmlText(semanticTaggedOutput.trim());
  if (tagged) {
    const serialized = serializeXmlStringWithHexQuoteEntities(tagged);
    return `${XML_DECLARATION}\n${serialized}\n`;
  }

  const body = serializeXmlStringWithHexQuoteEntities(
    `<extraction source="${escapeForXmlSerialization(result.document.filename)}">\n${formatHtmlSnippet(result, level)}\n</extraction>`,
  );
  return `${XML_DECLARATION}\n${body}\n`;
}

/** @deprecated Use formatXmlOutput — kept for callers that still import this name. */
export const formatXmlDownload = formatXmlOutput;

// Backward-compatible aliases used by the page component.
export const formatTaggedDocument = formatHtmlSnippet;
export const formatTaggedPage = formatHtmlPage;
export const formatTaggedBlock = formatHtmlBlock;
