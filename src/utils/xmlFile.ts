export function isXmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xml") || file.type === "application/xml" || file.type === "text/xml";
}
