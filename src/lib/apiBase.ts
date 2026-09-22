/** Production API (Render). Override with VITE_API_URL in Vercel env if needed. */
export const PRODUCTION_API_URL = "https://internal-tool-backend-x10p.onrender.com";

export function resolveApiBaseUrl(): string {
  const fromEnv = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return import.meta.env.PROD ? PRODUCTION_API_URL : "";
}
