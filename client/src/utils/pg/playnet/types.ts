import type { Connection } from "@solana/web3.js";

/** Playnet RPC request */
export interface RpcRequest {
  jsonrpc: string;
  method: keyof Connection;
  params: any[];
  id: string;
}

/** Playnet RPC response */
export type RpcResponse<K extends keyof Connection> = {
  jsonrpc: string;
  result: Connection[K] extends (...args: any[]) => any
    ? Awaited<ReturnType<Connection[K]>>
    : null;
  id: string;
};

/** Playnet RPC response with context */
export type RpcResponseWithContext<K extends keyof Connection> = {
  jsonrpc: string;
  result: {
    context: { apiVersion: string; slot: number };
    value: Connection[K] extends (...args: any[]) => any
      ? Awaited<ReturnType<Connection[K]>>
      : null;
  };
  id: string;
};

/** Overridable `Connection` instance */
export type OverridableConnection = Connection & { overridden?: boolean };
