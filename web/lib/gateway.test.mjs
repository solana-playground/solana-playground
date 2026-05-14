import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import {
  GATEWAY_ROUTES,
  PROXY_DROP_HEADERS,
  makeGatewayHandler,
  sanitizeOutboundHeaders,
} from "./gateway.mjs";

// A logger that swallows output — tests exercise the error path intentionally.
const silentLogger = { error: () => {} };

test("sanitizeOutboundHeaders strips every hop-by-hop header", () => {
  const input = Object.fromEntries(
    [...PROXY_DROP_HEADERS].map((h) => [h, "x"]),
  );
  input["content-type"] = "application/json";
  const out = sanitizeOutboundHeaders(input);
  assert.deepEqual(out, { "content-type": "application/json" });
});

test("sanitizeOutboundHeaders strips host and content-length", () => {
  const input = { host: "example.com", "content-length": "42", "x-keep": "v" };
  assert.deepEqual(sanitizeOutboundHeaders(input), { "x-keep": "v" });
});

test("sanitizeOutboundHeaders is case-insensitive", () => {
  const input = { Host: "x", "Content-Length": "1", "X-Trace": "t" };
  assert.deepEqual(sanitizeOutboundHeaders(input), { "X-Trace": "t" });
});

test("sanitizeOutboundHeaders preserves unrelated headers", () => {
  const input = {
    authorization: "Bearer xyz",
    "x-trace-id": "abc",
    accept: "*/*",
  };
  assert.deepEqual(sanitizeOutboundHeaders(input), input);
});

test("gateway injects x-api-key when apiKey is set", async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return new Response("ok", { status: 200 });
  };

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "secret",
      fetchImpl,
    }),
  );

  const res = await app.fetch(
    new Request("http://localhost/build", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ files: [] }),
    }),
  );

  assert.equal(res.status, 200);
  assert.equal(captured.url, "http://rust:8080/build");
  assert.equal(captured.init.headers["x-api-key"], "secret");
});

test("gateway does not inject x-api-key when empty", async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = init;
    return new Response("ok", { status: 200 });
  };

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "",
      fetchImpl,
    }),
  );

  await app.fetch(new Request("http://localhost/build", { method: "POST" }));
  assert.equal(captured.headers["x-api-key"], undefined);
});

test("gateway strips hop-by-hop headers from the outbound request", async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = init;
    return new Response("ok", { status: 200 });
  };

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "k",
      fetchImpl,
    }),
  );

  await app.fetch(
    new Request("http://localhost/build", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        connection: "keep-alive",
        "transfer-encoding": "chunked",
        upgrade: "websocket",
      },
    }),
  );

  assert.equal(captured.headers["connection"], undefined);
  assert.equal(captured.headers["transfer-encoding"], undefined);
  assert.equal(captured.headers["upgrade"], undefined);
  assert.equal(captured.headers["content-type"], "application/json");
});

test("gateway returns 502 when upstream fetch throws", async () => {
  const fetchImpl = async () => {
    throw new Error("ECONNREFUSED");
  };

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "k",
      fetchImpl,
      logger: silentLogger,
    }),
  );

  const res = await app.fetch(
    new Request("http://localhost/build", { method: "POST" }),
  );
  assert.equal(res.status, 502);
  assert.equal(await res.text(), "Bad Gateway");
});

test("gateway forwards the upstream status code unchanged", async () => {
  const fetchImpl = async () => new Response("Unauthorized", { status: 401 });

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "k",
      fetchImpl,
    }),
  );

  const res = await app.fetch(
    new Request("http://localhost/build", { method: "POST" }),
  );
  assert.equal(res.status, 401);
  assert.equal(await res.text(), "Unauthorized");
});

test("gateway strips content-encoding and content-length from upstream response", async () => {
  const fetchImpl = async () =>
    new Response("body", {
      status: 200,
      headers: {
        "content-encoding": "br",
        "content-length": "4",
        "transfer-encoding": "chunked",
        "content-type": "application/json",
      },
    });

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "k",
      fetchImpl,
    }),
  );

  const res = await app.fetch(
    new Request("http://localhost/build", { method: "POST" }),
  );
  assert.equal(res.headers.get("content-encoding"), null);
  assert.equal(res.headers.get("transfer-encoding"), null);
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.equal(await res.text(), "body");
});

test("gateway logs upstream body stream errors", async () => {
  const errorBody = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("partial"));
      controller.error(new Error("upstream RST"));
    },
  });
  const fetchImpl = async () =>
    new Response(errorBody, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

  const errorMock = mock.fn();
  const logger = { error: errorMock };

  const app = new Hono();
  app.post(
    "/build",
    makeGatewayHandler({
      serverUrl: "http://rust:8080",
      apiKey: "k",
      fetchImpl,
      logger,
    }),
  );

  const res = await app.fetch(
    new Request("http://localhost/build", { method: "POST" }),
  );

  assert.equal(res.status, 200);
  await res.text().catch(() => {});
  await new Promise((r) => setImmediate(r));

  assert.equal(errorMock.mock.callCount(), 1);
  const [msg, err] = errorMock.mock.calls[0].arguments;
  assert.match(msg, /body stream failed/);
  assert.equal(err.message, "upstream RST");
});

test("GATEWAY_ROUTES matches the Rust server's protected router", () => {
  // Mirrors `server/src/main.rs` — update in lockstep if Rust routes change.
  assert.deepEqual(GATEWAY_ROUTES, [
    { method: "POST", path: "/build" },
    { method: "GET", path: "/deploy/:uuid" },
    { method: "GET", path: "/share/:id" },
    { method: "POST", path: "/new" },
  ]);
});
