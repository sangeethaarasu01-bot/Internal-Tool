/** Production API (Render). Override with VITE_API_URL in Vercel or local .env if needed. */
export const PRODUCTION_API_URL = "https://internal-tool-backend-x10p.onrender.com";

export function resolveApiBaseUrl(): string {
  const useDevProxy =
    import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY === "true";

  if (useDevProxy) return "";

  const fromEnv = String(import.meta.env.VITE_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  return PRODUCTION_API_URL;
}
