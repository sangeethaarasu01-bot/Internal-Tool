export type ProjectStatus = "P" | "S";

export interface ProjectItem {
  id: string;
  title: string;
  stories: number;
  progress: number;
  status: ProjectStatus;
  route?: string;
}

export const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: "ieee-xml",
    title: "IEEE XML Converter",
    stories: 9,
    progress: 72,
    status: "S",
    route: "/home",
  },
  {
    id: "jats-batch",
    title: "JATS Batch Processing – Q3",
    stories: 14,
    progress: 45,
    status: "P",
  },
  {
    id: "metadata",
    title: "Metadata Extraction Pipeline",
    stories: 8,
    progress: 30,
    status: "S",
  },
  {
    id: "pdf-qc",
    title: "PDF Quality Check Workflow",
    stories: 6,
    progress: 0,
    status: "P",
  },
  {
    id: "doi-mapping",
    title: "DOI Mapping & Validation",
    stories: 11,
    progress: 60,
    status: "S",
  },
  {
    id: "author-parse",
    title: "Author Parsing Improvements",
    stories: 5,
    progress: 0,
    status: "P",
  },
  {
    id: "xml-schema",
    title: "IEEE Schema Compliance Review",
    stories: 10,
    progress: 25,
    status: "S",
  },
  {
    id: "export-hub",
    title: "XML Export & Download Hub",
    stories: 7,
    progress: 85,
    status: "S",
    route: "/conversions",
  },
];
