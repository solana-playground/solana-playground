import {
  ConnectionClosedError,
  JsonRpcConnection,
  MessageSocket,
  ResponseError,
} from "../jsonrpc";

/** In-memory socket: records what was sent, lets the test inject frames. */
const createSocket = () => {
  const listeners: { [type: string]: Array<(ev: any) => void> } = {};
  const sent: any[] = [];
  const socket: MessageSocket = {
    send: (data) => sent.push(JSON.parse(data)),
    close: jest.fn(),
    addEventListener: (type, listener) => {
      (listeners[type] ??= []).push(listener);
    },
  };
  const emit = (type: string, ev: any) =>
    listeners[type]?.forEach((l) => l(ev));
  const receive = (msg: unknown) =>
    emit("message", { data: JSON.stringify(msg) });

  return { socket, sent, receive, emit };
};

describe("JsonRpcConnection", () => {
  it("sends requests with increasing ids and resolves their results", async () => {
    const { socket, sent, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const p1 = conn.request("initialize", { a: 1 });
    const p2 = conn.request("shutdown");
    expect(sent).toEqual([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { a: 1 } },
      { jsonrpc: "2.0", id: 2, method: "shutdown", params: undefined },
    ]);

    receive({ jsonrpc: "2.0", id: 2, result: null });
    receive({ jsonrpc: "2.0", id: 1, result: { capabilities: {} } });
    await expect(p1).resolves.toEqual({ capabilities: {} });
    await expect(p2).resolves.toBeNull();
  });

  it("rejects with a ResponseError on error responses", async () => {
    const { socket, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const p = conn.request("textDocument/hover");
    receive({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32602, message: "bad params" },
    });

    await expect(p).rejects.toBeInstanceOf(ResponseError);
    await expect(p).rejects.toMatchObject({ code: -32602 });
  });

  it("dispatches notifications and answers server requests", async () => {
    const { socket, sent, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const diagnostics = jest.fn();
    conn.onNotification("textDocument/publishDiagnostics", diagnostics);
    conn.onRequest("window/workDoneProgress/create", () => undefined);

    receive({
      jsonrpc: "2.0",
      method: "textDocument/publishDiagnostics",
      params: { uri: "file:///x", diagnostics: [] },
    });
    expect(diagnostics).toHaveBeenCalledWith({
      uri: "file:///x",
      diagnostics: [],
    });

    receive({
      jsonrpc: "2.0",
      id: "srv-1",
      method: "window/workDoneProgress/create",
      params: { token: "t" },
    });
    receive({ jsonrpc: "2.0", id: "srv-2", method: "unknown/method" });
    await Promise.resolve();

    // Responses to different requests may be sent in any order
    expect(sent).toHaveLength(2);
    expect(sent).toContainEqual({ jsonrpc: "2.0", id: "srv-1", result: null });
    expect(sent).toContainEqual({
      jsonrpc: "2.0",
      id: "srv-2",
      error: { code: -32601, message: "Method not found: unknown/method" },
    });
  });

  it("fails pending and future requests once the socket closes", async () => {
    const { socket, emit } = createSocket();
    const conn = new JsonRpcConnection(socket);
    const onClose = jest.fn();
    conn.onClose(onClose);

    const pending = conn.request("textDocument/completion");
    emit("close", {});

    await expect(pending).rejects.toBeInstanceOf(ConnectionClosedError);
    await expect(conn.request("x")).rejects.toBeInstanceOf(
      ConnectionClosedError
    );
    expect(conn.closed).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Notifications after close are dropped silently
    expect(() => conn.notify("exit")).not.toThrow();
  });

  it("closes the socket on dispose", () => {
    const { socket } = createSocket();
    const conn = new JsonRpcConnection(socket);
    conn.dispose();
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(conn.closed).toBe(true);
  });
});
