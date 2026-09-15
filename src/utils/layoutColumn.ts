const GUTTER = 18;

export function classifyBlockColumn(
  bbox: number[],
  pageWidth: number,
): "LEFT" | "RIGHT" | "FULL_WIDTH" {
  const [x0, , x1] = bbox;
  const mid = pageWidth / 2;
  if (x0 < mid - GUTTER && x1 > mid + GUTTER) return "FULL_WIDTH";
  if (x0 >= mid - GUTTER) return "RIGHT";
  return "LEFT";
}
