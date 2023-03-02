import { Connection } from "@solana/web3.js";

export interface RpcRequest {
  jsonrpc: string;
  method: keyof Connection;
  params: any[];
  id: string;
}

export type RpcResponse<K extends keyof Connection> = {
  jsonrpc: string;
  result: Connection[K] extends (...args: any[]) => any
    ? Awaited<ReturnType<Connection[K]>>
    : null;
  id: string;
};

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

export type OverrideableConnection = Connection & { overridden?: boolean };
