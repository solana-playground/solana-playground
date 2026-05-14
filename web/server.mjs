import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { GATEWAY_ROUTES, makeGatewayHandler } from "./lib/gateway.mjs";

const PORT = Number(process.env.PG_PORT ?? 8080);
const SERVER_URL = process.env.PG_SERVER_URL;
const API_KEY = process.env.PG_API_KEY ?? "";
const STATIC_DIR = resolve(process.env.PG_STATIC_DIR ?? "build");
const INDEX_HTML = readFileSync(resolve(STATIC_DIR, "index.html"), "utf8");

if (!SERVER_URL) {
  console.error("PG_SERVER_URL is required");
  process.exit(1);
}

if (!API_KEY) {
  console.warn(
    "PG_API_KEY is not configured — proxied requests will be sent without an X-API-Key header",
  );
}

const app = new Hono();

// Cross-origin isolation for SharedArrayBuffer (WASM workers).
app.use("*", async (c, next) => {
  await next();
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header("Cross-Origin-Embedder-Policy", "require-corp");
});

// Custom web-tier endpoints — add as needed.
app.get("/api/health", (c) => c.json({ ok: true }));

// Proxy fixed API routes to the Rust backend, injecting X-API-Key server-side.
// Everything else is served as static assets (SPA fallback below).
const gatewayHandler = makeGatewayHandler({
  serverUrl: SERVER_URL,
  apiKey: API_KEY,
});
for (const { method, path } of GATEWAY_ROUTES) {
  app.on(method, path, gatewayHandler);
}

// Static files with SPA fallback.
app.use("/*", serveStatic({ root: STATIC_DIR }));
app.notFound((c) => c.html(INDEX_HTML));

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`playground-web listening on :${info.port}`),
);
