import { Commitment } from "@solana/web3.js";

import { Endpoint } from "../../constants";

export interface PgConnectionConfig {
  endpoint: Endpoint;
  commitment: Commitment;
  preflightChecks: boolean;
}

interface UpdateConnectionParams {
  endpoint?: Endpoint;
  commitment?: Commitment;
  preflightChecks?: boolean;
}

export class PgConnection {
  private static readonly _CONNECTION_KEY = "connection";
  private static readonly _DEFAULT_CONNECTION: PgConnectionConfig = {
    endpoint: Endpoint.DEVNET,
    commitment: "confirmed",
    preflightChecks: true,
  };

  static readonly EVT_NAME_REFRESH_CONNECTION = "refreshconnection";

  static get endpoint(): Endpoint {
    return this.getConnectionConfig().endpoint;
  }

  static get commitment(): Commitment {
    return this.getConnectionConfig().commitment;
  }

  static get preflightChecks(): boolean {
    return this.getConnectionConfig().preflightChecks;
  }

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

  static update(params: UpdateConnectionParams) {
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
   * Updates the connection from WASM and refreshes the app
   */
  static updateWasm(endpoint: string, commitment: string) {
    this.update({
      endpoint: endpoint as Endpoint,
      commitment: commitment as Commitment,
    });

    const refreshConnectionEvent = new CustomEvent(
      this.EVT_NAME_REFRESH_CONNECTION
    );
    document.dispatchEvent(refreshConnectionEvent);
  }
}
