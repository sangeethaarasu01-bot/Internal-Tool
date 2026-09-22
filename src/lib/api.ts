import axios from "axios";
import type { Client, Job, MappingPlan, SchemaMap } from "../types";

const base = import.meta.env.VITE_API_URL || "";

const http = axios.create({ baseURL: base });

export async function uploadFiles(
  pdf: File,
  template?: File,
  clientId?: string,
): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("pdf", pdf);
  if (template) form.append("template", template);
  if (clientId) form.append("client_id", clientId);
  const { data } = await http.post("/api/upload", form);
  return data;
}

export async function startConvert(jobId: string): Promise<void> {
  await http.post(`/api/convert/${jobId}`);
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await http.get<Job>(`/api/jobs/${id}`);
  return data;
}

export async function listJobs(): Promise<Job[]> {
  const { data } = await http.get<Job[]>("/api/jobs");
  return data;
}

export async function getResult(id: string) {
  const { data } = await http.get(`/api/result/${id}`);
  return data;
}

export function downloadUrl(id: string): string {
  return `${base}/api/download/${id}`;
}

export async function listClients(): Promise<Client[]> {
  const { data } = await http.get<Client[]>("/api/clients");
  return data;
}

export async function createClient(name: string, slug: string, file: File): Promise<Client> {
  const form = new FormData();
  form.append("name", name);
  form.append("slug", slug);
  form.append("template", file);
  const { data } = await http.post<Client>("/api/clients", form);
  return data;
}

export async function getSchemaForJob(id: string): Promise<{
  schema_map?: SchemaMap;
  mapping_plan?: MappingPlan;
}> {
  const { data } = await http.get(`/api/schema/job/${id}`);
  return data;
}

export async function getSchemaForClient(id: string): Promise<SchemaMap> {
  const { data } = await http.get<SchemaMap>(`/api/schema/${id}`);
  return data;
}

export async function reanalyzeClient(id: string): Promise<void> {
  await http.post(`/api/clients/${id}/reanalyze`);
}
