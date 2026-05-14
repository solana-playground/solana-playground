// Gateway for the Rust API.
//
// Lives in its own module so the hardening — header sanitization, upstream
// error handling — can be unit-tested in isolation from the `serve()`
// bootstrap in `server.mjs`.

// The four routes the Rust server exposes behind its `X-API-Key` gate.
// Mirrored in gateway.test.mjs.
export const GATEWAY_ROUTES = [
  { method: "POST", path: "/build" },
  { method: "GET", path: "/deploy/:uuid" },
  { method: "GET", path: "/share/:id" },
  { method: "POST", path: "/new" },
];

// Hop-by-hop headers stripped before forwarding to the backend.
export const PROXY_DROP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const sanitizeOutboundHeaders = (raw) => {
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = key.toLowerCase();
    if (k === "host" || k === "content-length" || PROXY_DROP_HEADERS.has(k))
      continue;
    out[key] = value;
  }
  return out;
};

// Build a Hono handler that forwards the inbound request to the Rust service.
// `fetchImpl` is injected so tests can stub upstream without sockets.
export const makeGatewayHandler = ({
  serverUrl,
  apiKey,
  fetchImpl = fetch,
  logger = console,
}) => {
  return async (c) => {
    const target = `${serverUrl}${c.req.path}`;
    const headers = sanitizeOutboundHeaders(
      Object.fromEntries(c.req.raw.headers),
    );
    if (apiKey) headers["x-api-key"] = apiKey;

    let upstream;
    try {
      upstream = await fetchImpl(target, {
        method: c.req.method,
        headers,
        body: ["GET", "HEAD"].includes(c.req.method)
          ? undefined
          : c.req.raw.body,
        duplex: "half",
      });
    } catch (err) {
      logger.error(
        `gateway ${c.req.method} ${c.req.path} → ${target} failed:`,
        err,
      );
      return c.text("Bad Gateway", 502);
    }

    // Node fetch decompresses the body but keeps the original encoding headers.
    // Strip them to avoid ERR_CONTENT_DECODING_FAILED in the browser.
    const resHeaders = new Headers(upstream.headers);
    resHeaders.delete("content-encoding");
    resHeaders.delete("content-length");
    resHeaders.delete("transfer-encoding");

    // Mid-stream errors cannot become a 5xx (headers already flushed); log them.
    const body = upstream.body
      ? observeStreamErrors(upstream.body, (err) =>
          logger.error(
            `gateway ${c.req.method} ${c.req.path} → ${target} body stream failed:`,
            err,
          ),
        )
      : null;

    return new Response(body, {
      status: upstream.status,
      headers: resHeaders,
    });
  };
};

const observeStreamErrors = (source, onError) => {
  const ts = new TransformStream();
  source.pipeTo(ts.writable).catch(onError);
  return ts.readable;
};
