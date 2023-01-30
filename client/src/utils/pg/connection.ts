import { Commitment, Connection, ConnectionConfig } from "@solana/web3.js";

import { Endpoint, EventName } from "../../constants";
import { PgCommon } from "./common";
import { PgSet } from "./types";

export interface PgConnectionConfig {
  endpoint: Endpoint;
  commitment: Commitment;
  preflightChecks: boolean;
}

export class PgConnection {
  private static readonly _CONNECTION_KEY = "connection";
  private static readonly _DEFAULT_CONNECTION: PgConnectionConfig = {
    endpoint: Endpoint.DEVNET,
    commitment: "confirmed",
    preflightChecks: true,
  };

  /** Get the endpoint from localStorage */
  static get endpoint(): Endpoint {
    return this.getConnectionConfig().endpoint;
  }

  /** Get the commitment from localStorage */
  static get commitment(): Commitment {
    return this.getConnectionConfig().commitment;
  }

  /** Get the preflightChecks from localStorage */
  static get preflightChecks(): boolean {
    return this.getConnectionConfig().preflightChecks;
  }

  /**
   * Get the connection config from localStorage or create the default connection
   * if it doesn't exist
   */
  static getConnectionConfig() {
    let conn = localStorage.getItem(this._CONNECTION_KEY);
    if (!conn) {
      // Remove old endpoint key if it exists
      // TODO: Remove this when changing the domain
      if (localStorage.getItem("endpoint")) localStorage.removeItem("endpoint");

      const connStr = JSON.stringify(this._DEFAULT_CONNECTION);
      localStorage.setItem(this._CONNECTION_KEY, connStr);
      conn = connStr;
    }

    return JSON.parse(conn) as PgConnectionConfig;
  }

  /**
   * Update the connection config in localStorage
   *
   * @param params update config values
   */
  static update(params: Partial<PgConnectionConfig>) {
    const { endpoint, commitment, preflightChecks } = params;
    const conn = this.getConnectionConfig();

    if (endpoint) conn.endpoint = endpoint;
    if (commitment) conn.commitment = commitment;
    if (preflightChecks !== undefined) {
      conn.preflightChecks = !!preflightChecks;
    }

    localStorage.setItem(this._CONNECTION_KEY, JSON.stringify(conn));
  }

  /**
   * Update the connection from WASM and refresh the UI
   */
  static updateWasm(endpoint: string, commitment: string) {
    this.update({
      endpoint: endpoint as Endpoint,
      commitment: commitment as Commitment,
    });

    PgCommon.createAndDispatchCustomEvent(EventName.CONNECTION_REFRESH);
  }

  /**
   * Create a connection with project defaults from localStorage
   *
   * @param opts connection options
   * @returns web3.js connection
   */
  static createConnection(opts?: { endpoint?: string } & ConnectionConfig) {
    return new Connection(
      opts?.endpoint ?? this.endpoint,
      opts ?? this.commitment
    );
  }

  /**
   * Get whether the connection is ready to be used.
   *
   * If the endpoint is `Endpoint.PLAYNET` this will return `false` until the
   * connection gets overridden. This helps avoid sending unnecessary RPC requests
   * at start before the `connection` and `fetch` is overridden.
   *
   * This will always return `true` if the endpoint is not `Endpoint.PLAYNET`.
   *
   * @param conn web3.js connection
   * @returns whether the connection is ready to be used
   */
  static isReady(conn: Connection & { overridden?: boolean }) {
    if (conn.rpcEndpoint === Endpoint.PLAYNET) {
      return conn.overridden;
    }

    return true;
  }

  /**
   * Statically get the connection object in state
   *
   * @returns the connection object
   */
  static async get<T, R extends Connection>() {
    return await PgCommon.sendAndReceiveCustomEvent<T, R>(
      PgCommon.getStaticEventNames(EventName.CONNECTION_STATIC).get
    );
  }

  /**
   * Statically set the connection object in state
   *
   * @param set setConnection
   */
  static async set(set?: PgSet<Connection>) {
    PgCommon.createAndDispatchCustomEvent(EventName.CONNECTION_SET, set);
  }
}
