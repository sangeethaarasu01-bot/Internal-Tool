import type { PageExtraction, TextBlock } from "../../services/api";
import {
  formatHtmlBlock,
  formatHtmlLine,
  formatHtmlSpan,
  type TagLevel,
} from "../../utils/formatTaggedOutput";

function htmlForBlock(
  block: TextBlock,
  page: PageExtraction,
  level: TagLevel,
): string {
  if (level === "lines") return formatHtmlLine(block, page);
  if (level === "spans") return formatHtmlSpan(block, page);
  return formatHtmlBlock(block, page);
}

export function TaggedBlockList({
  page,
  blocks,
  level = "blocks",
}: {
  page: PageExtraction;
  blocks: TextBlock[];
  level?: TagLevel;
}) {
  return (
    <div className="tagged-block-list">
      {blocks.map((block) => {
        const html = htmlForBlock(block, page, level);
        return (
          <article key={block.block_id} className="html-tag-row">
            <pre className="html-tag-code">{html}</pre>
          </article>
        );
      })}
    </div>
  );
}
