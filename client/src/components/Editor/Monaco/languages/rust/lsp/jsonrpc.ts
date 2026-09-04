import type { Disposable } from "../../../../../../utils";

/** The part of `WebSocket` the connection uses (swappable in tests) */
export interface MessageSocket {
  send: (data: string) => void;
  close: () => void;
  addEventListener: (
    type: "message" | "close" | "error",
    listener: (ev: { data?: unknown }) => void
  ) => void;
}

/** The part of Monaco's `CancellationToken` the connection uses */
export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: (listener: () => void) => Disposable;
}

interface RequestMessage {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}

interface NotificationMessage {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

interface ResponseMessage {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

type Message = RequestMessage | NotificationMessage | ResponseMessage;

/** Error returned by the server for a request */
export class ResponseError extends Error {
  constructor(readonly code: number, message: string, readonly data?: unknown) {
    super(message);
    this.name = "ResponseError";
  }
}

/** `textDocument/*` requests that arrive after the socket closed */
export class ConnectionClosedError extends Error {
  constructor() {
    super("LSP connection is closed");
    this.name = "ConnectionClosedError";
  }
}

/**
 * JSON-RPC 2.0 over a message socket, one message per frame.
 *
 * No `Content-Length` framing: the WebSocket already delimits messages. The
 * server side of the bridge adds the framing for the language server's stdio.
 */
export class JsonRpcConnection {
  private _nextId = 1;
  private _pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private _notificationHandlers = new Map<string, (params: unknown) => void>();
  private _requestHandlers = new Map<
    string,
    (params: unknown) => unknown | Promise<unknown>
  >();
  private _closeListeners: Array<() => void> = [];
  private _closed = false;

  constructor(private readonly _socket: MessageSocket) {
    _socket.addEventListener("message", (ev) => this._receive(ev.data));
    _socket.addEventListener("close", () => this._handleClose());
    _socket.addEventListener("error", () => this._handleClose());
  }

  /** Whether the socket has closed */
  get closed() {
    return this._closed;
  }

  /**
   * Send a request and wait for its response.
   *
   * Cancelling the token sends `$/cancelRequest`; the server then answers
   * with an error, which rejects the returned promise.
   */
  request<R>(
    method: string,
    params?: unknown,
    token?: CancellationToken
  ): Promise<R> {
    if (this._closed) return Promise.reject(new ConnectionClosedError());

    const id = this._nextId++;
    const cancellation = token?.onCancellationRequested(() => {
      if (this._pending.has(id)) this.notify("$/cancelRequest", { id });
    });
    return new Promise<unknown>((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this._send({ jsonrpc: "2.0", id, method, params });
    }).finally(() => cancellation?.dispose()) as Promise<R>;
  }

  /** Send a notification (no response). */
  notify(method: string, params?: unknown) {
    if (this._closed) return;
    this._send({ jsonrpc: "2.0", method, params });
  }

  /** Handle a notification from the server. */
  onNotification<P>(method: string, handler: (params: P) => void): Disposable {
    this._notificationHandlers.set(
      method,
      handler as (params: unknown) => void
    );
    return { dispose: () => this._notificationHandlers.delete(method) };
  }

  /** Handle a request from the server. */
  onRequest<P, R>(
    method: string,
    handler: (params: P) => R | Promise<R>
  ): Disposable {
    this._requestHandlers.set(
      method,
      handler as (params: unknown) => unknown | Promise<unknown>
    );
    return { dispose: () => this._requestHandlers.delete(method) };
  }

  /** Run the callback once when the connection closes. */
  onClose(cb: () => void): Disposable {
    this._closeListeners.push(cb);
    return {
      dispose: () => {
        this._closeListeners = this._closeListeners.filter((l) => l !== cb);
      },
    };
  }

  /** Close the socket and fail all pending requests. */
  dispose() {
    if (this._closed) return;
    this._socket.close();
    this._handleClose();
  }

  private _send(msg: Message) {
    this._socket.send(JSON.stringify(msg));
  }

  private _receive(data: unknown) {
    if (typeof data !== "string") return;

    let msg: Message;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if ("method" in msg) {
      if ("id" in msg) this._handleRequest(msg);
      else this._notificationHandlers.get(msg.method)?.(msg.params);
      return;
    }

    if (typeof msg.id !== "number") return;
    const pending = this._pending.get(msg.id);
    if (!pending) return;
    this._pending.delete(msg.id);

    if (msg.error) {
      pending.reject(
        new ResponseError(msg.error.code, msg.error.message, msg.error.data)
      );
    } else {
      pending.resolve(msg.result ?? null);
    }
  }

  private async _handleRequest(msg: RequestMessage) {
    const handler = this._requestHandlers.get(msg.method);
    if (!handler) {
      this._send({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32601, message: `Method not found: ${msg.method}` },
      });
      return;
    }

    try {
      const result = await handler(msg.params);
      this._send({ jsonrpc: "2.0", id: msg.id, result: result ?? null });
    } catch (e) {
      this._send({
        jsonrpc: "2.0",
        id: msg.id,
        error: {
          code: -32603,
          message: e instanceof Error ? e.message : "Internal error",
        },
      });
    }
  }

  private _handleClose() {
    if (this._closed) return;
    this._closed = true;

    for (const { reject } of this._pending.values()) {
      reject(new ConnectionClosedError());
    }
    this._pending.clear();

    const listeners = this._closeListeners;
    this._closeListeners = [];
    listeners.forEach((cb) => cb());
  }
}
