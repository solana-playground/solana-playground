import type { PgWeb3 } from "../web3";

/** Playnet RPC request */
export interface RpcRequest {
  jsonrpc: string;
  method: keyof PgWeb3.Connection;
  params: any[];
  id: string;
}

/** Playnet RPC response */
export type RpcResponse<K extends keyof PgWeb3.Connection> = {
  jsonrpc: string;
  result: PgWeb3.Connection[K] extends (...args: any[]) => any
    ? Awaited<ReturnType<PgWeb3.Connection[K]>>
    : null;
  id: string;
};

/** Playnet RPC response with context */
export type RpcResponseWithContext<K extends keyof PgWeb3.Connection> = {
  jsonrpc: string;
  result: {
    context: { apiVersion: string; slot: number };
    value: PgWeb3.Connection[K] extends (...args: any[]) => any
      ? Awaited<ReturnType<PgWeb3.Connection[K]>>
      : null;
  };
  id: string;
};

/** Overridable `Connection` instance */
export type OverridableConnection = PgWeb3.Connection & {
  overridden?: boolean;
};
