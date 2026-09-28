import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const LOCAL_BACKEND_DEFAULT = "http://localhost:8000";

function proxyTargetFromEnv(env: Record<string, string>): string {
  const raw = (env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  return raw || LOCAL_BACKEND_DEFAULT;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const useDevProxy = env.VITE_USE_DEV_PROXY === "true";
  const target = proxyTargetFromEnv(env);

  const proxy = useDevProxy
    ? {
        "/api": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      }
    : undefined;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      ...(proxy ? { proxy } : {}),
    },
  };
});
