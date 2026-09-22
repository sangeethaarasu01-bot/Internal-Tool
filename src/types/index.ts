export type JobStatus = "uploaded" | "processing" | "completed" | "failed" | "deleted";

export interface Job {
  id: string;
  client_id: string | null;
  status: JobStatus;
  stage: string;
  progress: number;
  pdf_filename: string;
  template_filename: string | null;
  pdf_path: string;
  template_path: string;
  output_path: string | null;
  schema_map_path: string | null;
  mapping_plan_path: string | null;
  error: string | null;
  llm_cost_usd: number;
  llm_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  template_path: string;
  schema_map_path: string | null;
  template_hash: string;
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  type: "stage" | "token" | "log" | "error" | "done" | "ping";
  message?: string;
  progress?: number;
}

export interface SchemaElement {
  xpath: string;
  tag: string;
  semantic: string;
  cardinality: "single" | "repeating";
  data_type: string;
  required: boolean;
  attributes: Record<string, string>;
  sample: string;
  children: SchemaElement[];
  notes: string;
}

export interface SchemaMap {
  root_tag: string;
  namespaces: Record<string, string>;
  doctype: string | null;
  elements: SchemaElement[];
  template_hash: string;
  analyzed_at: string;
  llm_model: string;
  llm_cost_usd: number;
}

export interface MappingEntry {
  xml_xpath: string;
  xml_tag: string;
  pdf_field: string;
  transform: string;
  transform_arg: string | null;
  confidence: number;
  reasoning: string;
}

export interface MappingPlan {
  mappings: MappingEntry[];
  unmapped_xml: string[];
  unmapped_pdf: string[];
  warnings: string[];
  llm_model: string;
  llm_cost_usd: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
