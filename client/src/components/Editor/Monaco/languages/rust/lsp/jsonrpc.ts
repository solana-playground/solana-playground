import { createWebSocketConnection, toSocket } from "vscode-ws-jsonrpc";
import type { IWebSocket } from "vscode-ws-jsonrpc";
import { ErrorCodes, ResponseError } from "vscode-jsonrpc";
import type { MessageConnection } from "vscode-jsonrpc";

import type { Disposable } from "../../../../../../utils";

export { ResponseError };
export type { IWebSocket };

/** Request sent or pending after the socket closed */
export class ConnectionClosedError extends Error {
  constructor() {
    super("LSP connection is closed");
    this.name = "ConnectionClosedError";
  }
}

/**
 * JSON-RPC 2.0 over a WebSocket via `vscode-ws-jsonrpc`, one bare message per
 * frame. The server side of the bridge adds the `Content-Length` framing for
 * the language server's stdio.
 */
export class JsonRpcConnection {
  private readonly _socket: IWebSocket;
  private readonly _conn: MessageConnection;
  private _closeListeners: Array<() => void> = [];
  private _closed = false;

  constructor(
    socket: WebSocket | IWebSocket,
    /** Runs on every message sent or received, e.g. for a traffic indicator */
    onActivity?: () => void
  ) {
    const raw = "onMessage" in socket ? socket : toSocket(socket);
    this._socket = onActivity ? withActivity(raw, onActivity) : raw;
    this._conn = createWebSocketConnection(this._socket, console);
    this._conn.onClose(() => this._handleClose());
    this._conn.listen();
  }

  /** Whether the socket has closed */
  get closed() {
    return this._closed;
  }

  /** Send a request and wait for its response. */
  async request<R>(method: string, params?: unknown): Promise<R> {
    if (this._closed) throw new ConnectionClosedError();
    try {
      return await (params === undefined
        ? this._conn.sendRequest<R>(method)
        : this._conn.sendRequest<R>(method, params));
    } catch (e) {
      if (this._closed || isClosedError(e)) throw new ConnectionClosedError();
      throw e;
    }
  }

  /** Send a notification (no response). */
  notify(method: string, params?: unknown) {
    if (this._closed) return;
    try {
      const sent =
        params === undefined
          ? this._conn.sendNotification(method)
          : this._conn.sendNotification(method, params);
      sent.catch(() => {});
    } catch {
      // Lost the race with a closing socket
    }
  }

  /** Handle a notification from the server. */
  onNotification<P>(method: string, handler: (params: P) => void): Disposable {
    return this._conn.onNotification(
      method,
      handler as (params: unknown) => void
    );
  }

  /** Handle a request from the server. */
  onRequest<P, R>(
    method: string,
    handler: (params: P) => R | Promise<R>
  ): Disposable {
    return this._conn.onRequest(
      method,
      handler as (params: unknown) => R | Promise<R>
    );
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
    this._socket.dispose();
    this._handleClose();
  }

  private _handleClose() {
    if (this._closed) return;
    this._closed = true;
    // Rejects every pending request (a no-op when the library got there first)
    this._conn.dispose();
    const listeners = this._closeListeners;
    this._closeListeners = [];
    listeners.forEach((cb) => cb());
  }
}

/** Report traffic in both directions without touching the socket's own state. */
const withActivity = (socket: IWebSocket, onActivity: () => void): IWebSocket => ({
  send: (content) => {
    onActivity();
    socket.send(content);
  },
  onMessage: (cb) =>
    socket.onMessage((data) => {
      onActivity();
      cb(data);
    }),
  onError: (cb) => socket.onError(cb),
  onClose: (cb) => socket.onClose(cb),
  dispose: () => socket.dispose(),
});

/** The library rejects pending requests with this code when disposed */
const isClosedError = (e: unknown) =>
  e instanceof ResponseError && e.code === ErrorCodes.PendingResponseRejected;
