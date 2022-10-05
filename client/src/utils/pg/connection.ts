import { Commitment, Connection } from "@solana/web3.js";

import { Endpoint, EventName } from "../../constants";
import { PgCommon } from "./common";

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
   * Updates the connection from WASM and refreshes the app
   */
  static updateWasm(endpoint: string, commitment: string) {
    this.update({
      endpoint: endpoint as Endpoint,
      commitment: commitment as Commitment,
    });

    PgCommon.createAndDispatchCustomEvent(EventName.CONNECTION_REFRESH);
  }

  /**
   * Create a connection with the configured commitment settings
   *
   * @param endpoint rpc endpoint
   * @returns web3.js connection
   */
  static createConnectionFromUrl(endpoint: string) {
    return new Connection(endpoint, this.commitment);
  }

  /**
   * Statically get the connection object from state
   *
   * @returns the connection object
   */
  static async get<T, R extends Connection>() {
    return await PgCommon.sendAndReceiveCustomEvent<T, R>(
      PgCommon.getStaticEventNames(EventName.CONNECTION_STATIC).get
    );
  }
}
