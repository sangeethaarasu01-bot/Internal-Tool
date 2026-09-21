const HEX_QUOTE_DOUBLE = "&#x22;";
const HEX_QUOTE_SINGLE = "&#x27;";

const TYPOGRAPHIC_QUOTE_MAP: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201a": "'",
  "\u201b": "'",
  "\u2032": "'",
  "\u2035": "'",
  "\u2039": "'",
  "\u203a": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u201e": '"',
  "\u201f": '"',
  "\u2033": '"',
  "\u2036": '"',
  "\u00ab": '"',
  "\u00bb": '"',
  "\uff07": "'",
  "\uff02": '"',
};

const TYPOGRAPHIC_QUOTE_PATTERN =
  /[\u2018\u2019\u201a\u201b\u2032\u2035\u2039\u203a\u201c\u201d\u201e\u201f\u2033\u2036\u00ab\u00bb\uff07\uff02]/g;

const INLINE_TAGS = new Set([
  "bold",
  "italic",
  "sup",
  "sub",
  "xref",
  "inline-formula",
  "tex-math",
  "label",
  "kwd",
  "underline",
  "strike",
  "sc",
]);

function normalizeTypographicQuotes(text: string): string {
  return text.replace(
    TYPOGRAPHIC_QUOTE_PATTERN,
    (char) => TYPOGRAPHIC_QUOTE_MAP[char] ?? char,
  );
}

function escapeXmlChar(char: string): string {
  if (char === "&") {
    return "&amp;";
  }
  if (char === "<") {
    return "&lt;";
  }
  if (char === ">") {
    return "&gt;";
  }
  if (char === '"') {
    return HEX_QUOTE_DOUBLE;
  }
  if (char === "'") {
    return HEX_QUOTE_SINGLE;
  }
  const code = char.codePointAt(0) ?? 0;
  if (code > 0x7f) {
    const hex =
      code <= 0xffff
        ? code.toString(16).toUpperCase().padStart(4, "0")
        : code.toString(16).toUpperCase();
    return `&#x${hex};`;
  }
  return char;
}

/** Escape text at final XML serialization time only. */
export function escapeForXmlSerialization(value: string): string {
  const normalized = normalizeTypographicQuotes(value);
  let result = "";
  for (const char of normalized) {
    result += escapeXmlChar(char);
  }
  return result;
}

function hasBlockChildren(element: Element): boolean {
  return Array.from(element.children).some(
    (child) => !INLINE_TAGS.has(child.tagName.toLowerCase()),
  );
}

function formatAttributes(element: Element): string {
  const attrs = Array.from(element.attributes)
    .map((attr) => `${attr.name}="${escapeForXmlSerialization(attr.value)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
}

function isInsignificantWhitespace(value: string): boolean {
  return value.trim().length === 0;
}

function serializeInlineContent(element: Element): string {
  const tag = element.tagName;
  const parts = [`<${tag}${formatAttributes(element)}>`];
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!isInsignificantWhitespace(text)) {
        parts.push(escapeForXmlSerialization(text));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push(serializeInlineContent(node as Element));
    }
  }
  parts.push(`</${tag}>`);
  return parts.join("");
}

function serializeInline(element: Element, depth: number): string {
  const indent = "  ".repeat(depth);
  const tag = element.tagName;
  const parts = [`${indent}<${tag}${formatAttributes(element)}>`];
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!isInsignificantWhitespace(text)) {
        parts.push(escapeForXmlSerialization(text));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push(serializeInlineContent(node as Element));
    }
  }
  parts.push(`</${tag}>`);
  return parts.join("");
}

function serializeElement(element: Element, depth: number): string[] {
  const children = Array.from(element.children);
  if (children.length > 0 && !hasBlockChildren(element)) {
    return [serializeInline(element, depth)];
  }

  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  const tag = element.tagName;
  const attrSuffix = formatAttributes(element);

  if (children.length === 0) {
    const text = escapeForXmlSerialization(element.textContent ?? "");
    return [`${indent}<${tag}${attrSuffix}>${text}</${tag}>`];
  }

  const lines = [`${indent}<${tag}${attrSuffix}>`];
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text && !isInsignificantWhitespace(text)) {
        lines.push(`${childIndent}${escapeForXmlSerialization(text)}`);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      lines.push(...serializeElement(node as Element, depth + 1));
    }
  }
  lines.push(`${indent}</${tag}>`);
  return lines;
}

function parseXmlDocument(xml: string): Document | null {
  const parser = new DOMParser();
  const attempts = [xml, `<serialization-root>${xml}</serialization-root>`];
  for (const candidate of attempts) {
    const doc = parser.parseFromString(candidate, "application/xml");
    if (doc.getElementsByTagName("parsererror").length === 0) {
      return doc;
    }
  }
  return null;
}

/** Re-serialize XML with hex quote entities in text nodes and attributes. */
export function serializeXmlStringWithHexQuoteEntities(xml: string): string {
  const doc = parseXmlDocument(xml);
  if (!doc?.documentElement) {
    return xml;
  }

  const root = doc.documentElement;
  if (root.tagName === "serialization-root") {
    const wrappedChildren = Array.from(root.children);
    if (wrappedChildren.length === 1) {
      return serializeElement(wrappedChildren[0], 0).join("\n");
    }
    return wrappedChildren
      .flatMap((child) => serializeElement(child, 0))
      .join("\n");
  }

  return serializeElement(root, 0).join("\n");
}
