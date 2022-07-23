import { Commitment } from "@solana/web3.js";

import { Endpoint } from "../../constants";

interface Connection {
  commitment: Commitment;
  endpoint: Endpoint;
}

interface UpdateConnectionParams {
  commitment?: Commitment;
  endpoint?: Endpoint;
}

export class PgConnection {
  private static readonly _CONNECTION_KEY = "connection";

  static readonly DEFAULT_CONNECTION: Connection = {
    commitment: "confirmed",
    endpoint: Endpoint.DEVNET,
  };
  static readonly EVT_NAME_REFRESH_CONNECTION = "refreshconnection";

  static get commitment(): Commitment {
    return this.getConnection().commitment;
  }

  static get endpoint(): Endpoint {
    return this.getConnection().endpoint;
  }

  static getConnection() {
    let conn = localStorage.getItem(this._CONNECTION_KEY);
    if (!conn) {
      // Remove old endpoint key if it exists
      // TODO: Remove this when changing the domain
      if (localStorage.getItem("endpoint")) localStorage.removeItem("endpoint");

      const connStr = JSON.stringify(this.DEFAULT_CONNECTION);
      localStorage.setItem(this._CONNECTION_KEY, connStr);
      conn = connStr;
    }

    return JSON.parse(conn) as Connection;
  }

  static update(params: UpdateConnectionParams) {
    const { commitment, endpoint } = params;
    const conn = this.getConnection();

    if (commitment) conn.commitment = commitment;
    if (endpoint) conn.endpoint = endpoint;

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
