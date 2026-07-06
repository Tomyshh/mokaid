import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().default("http://localhost:4000"),
  VITE_WS_URL: z.string().default("ws://localhost:4000/socket"),
  VITE_ASSETS_CDN_URL: z.string().default(""),
  VITE_DISABLE_3D: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const env = envSchema.parse(import.meta.env);

/** Empty VITE_API_URL = same-origin (ALB routes /api/* to the API service). */
export function resolveApiUrl(path: string): URL {
  const base = env.VITE_API_URL.trim();
  return base ? new URL(`${base}${path}`) : new URL(path, window.location.origin);
}

/** Supports absolute ws(s) URLs or a path such as /socket on the current host. */
export function resolveWsUrl(): string {
  const configured = env.VITE_WS_URL.trim();
  if (configured.startsWith("ws://") || configured.startsWith("wss://")) {
    return configured;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const path = configured.startsWith("/") ? configured : `/${configured}`;
  return `${protocol}//${window.location.host}${path}`;
}
