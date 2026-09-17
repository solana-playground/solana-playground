import {
  ConnectionClosedError,
  JsonRpcConnection,
  ResponseError,
} from "../jsonrpc";
import type { IWebSocket } from "../jsonrpc";

/** In-memory socket: records what was sent, lets the test inject frames. */
const createSocket = () => {
  const sent: any[] = [];
  let messageCb: ((data: string) => void) | undefined;
  let closeCb: ((code: number, reason: string) => void) | undefined;

  const socket: IWebSocket = {
    send: (data) => sent.push(JSON.parse(data)),
    onMessage: (cb) => (messageCb = cb),
    onError: () => {},
    onClose: (cb) => (closeCb = cb),
    dispose: jest.fn(() => closeCb?.(1000, "disposed")),
  };
  const receive = (msg: unknown) => messageCb?.(JSON.stringify(msg));
  const close = () => closeCb?.(1000, "closed");

  return { socket, sent, receive, close };
};

/** The library delivers incoming messages on timers; let a few rounds run. */
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

describe("JsonRpcConnection — real vscode-ws-jsonrpc transport", () => {
  it("should send requests with increasing ids and resolve their results", async () => {
    const { socket, sent, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const p1 = conn.request("initialize", { a: 1 });
    const p2 = conn.request("shutdown");
    await settle();
    expect(sent).toEqual([
      { jsonrpc: "2.0", id: 0, method: "initialize", params: { a: 1 } },
      { jsonrpc: "2.0", id: 1, method: "shutdown" },
    ]);

    receive({ jsonrpc: "2.0", id: 1, result: null });
    receive({ jsonrpc: "2.0", id: 0, result: { capabilities: {} } });
    await expect(p1).resolves.toEqual({ capabilities: {} });
    await expect(p2).resolves.toBeNull();
  });

  it("should reject with a ResponseError on error responses", async () => {
    const { socket, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const p = conn.request("textDocument/hover");
    await settle();
    receive({
      jsonrpc: "2.0",
      id: 0,
      error: { code: -32602, message: "bad params" },
    });

    await expect(p).rejects.toBeInstanceOf(ResponseError);
    await expect(p).rejects.toMatchObject({ code: -32602 });
  });

  it("should dispatch notifications and answer server requests", async () => {
    const { socket, sent, receive } = createSocket();
    const conn = new JsonRpcConnection(socket);

    const diagnostics = jest.fn();
    conn.onNotification("textDocument/publishDiagnostics", diagnostics);
    conn.onRequest("window/workDoneProgress/create", () => null);

    receive({
      jsonrpc: "2.0",
      method: "textDocument/publishDiagnostics",
      params: { uri: "file:///x", diagnostics: [] },
    });
    await settle();
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
    await settle();
    await settle();

    // Responses to different requests may be sent in any order
    expect(sent).toHaveLength(2);
    expect(sent).toContainEqual({ jsonrpc: "2.0", id: "srv-1", result: null });
    expect(sent).toContainEqual(
      expect.objectContaining({
        jsonrpc: "2.0",
        id: "srv-2",
        error: expect.objectContaining({ code: -32601 }),
      })
    );
  });

  it("should fail pending and future requests once the socket closes", async () => {
    const { socket, close } = createSocket();
    const conn = new JsonRpcConnection(socket);
    const onClose = jest.fn();
    conn.onClose(onClose);

    const pending = conn.request("textDocument/completion");
    await settle();
    close();

    await expect(pending).rejects.toBeInstanceOf(ConnectionClosedError);
    await expect(conn.request("x")).rejects.toBeInstanceOf(
      ConnectionClosedError
    );
    expect(conn.closed).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Notifications after close are dropped silently
    expect(() => conn.notify("exit")).not.toThrow();
  });

  it("should close the socket on dispose", () => {
    const { socket } = createSocket();
    const conn = new JsonRpcConnection(socket);
    conn.dispose();
    expect(socket.dispose).toHaveBeenCalledTimes(1);
    expect(conn.closed).toBe(true);
  });
});
