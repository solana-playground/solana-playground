import { Connection, ConnectionConfig } from "@solana/web3.js";

import { PgCommon } from "./common";
import { PgSettings } from "./settings";
import { Endpoint, EventName } from "../../constants";
import type { OverridableConnection } from "./playnet";
import type { SetState } from "./types";

export class PgConnection {
  /** Connection RPC URL */
  static get endpoint() {
    return PgSettings.connection.endpoint;
  }

  /** Connection commitment level */
  static get commitment() {
    return PgSettings.connection.commitment;
  }

  /**
   * Update the connection from WASM and refresh the UI
   */
  static updateWasm(
    endpoint: typeof PgSettings.connection["endpoint"],
    commitment: typeof PgSettings.connection["commitment"]
  ) {
    PgSettings.connection.endpoint = endpoint;
    PgSettings.connection.commitment = commitment;
  }

  /**
   * Create a connection with project defaults from `localStorage`.
   *
   * @param opts connection options
   * @returns web3.js connection
   */
  static create(opts?: { endpoint?: string } & ConnectionConfig) {
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
   * @param conn overridable web3.js `Connection`
   * @returns whether the connection is ready to be used
   */
  static isReady(conn: OverridableConnection) {
    if (conn.rpcEndpoint === Endpoint.PLAYNET) {
      return conn.overridden;
    }

    return true;
  }

  /**
   * Statically get the connection object in state.
   *
   * @returns the connection object
   */
  static async get() {
    return await PgCommon.sendAndReceiveCustomEvent<Connection>(
      PgCommon.getStaticStateEventNames(EventName.CONNECTION_STATIC).get
    );
  }

  /**
   * Statically set the connection object in state.
   *
   * @param set setConnection
   */
  static async set(set?: SetState<Connection>) {
    PgCommon.createAndDispatchCustomEvent(
      PgCommon.getStaticStateEventNames(EventName.CONNECTION_STATIC).set,
      set
    );
  }
}
