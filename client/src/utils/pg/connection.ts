import { Commitment } from "@solana/web3.js";

import { Endpoint } from "../../constants";

interface Connection {
  commitment?: Commitment;
  endpoint?: Endpoint;
}

export class PgConnection {
  private static readonly CONNECTION_KEY = "connection";
  static readonly DEFAULT_CONNECTION: Connection = {
    commitment: "confirmed",
    endpoint: Endpoint.DEVNET,
  };

  static get commitment(): Commitment {
    return (
      this.getConnection().commitment ?? this.DEFAULT_CONNECTION.commitment!
    );
  }

  static get endpoint(): Endpoint {
    return this.getConnection().endpoint ?? this.DEFAULT_CONNECTION.endpoint!;
  }

  static getConnection() {
    let conn = localStorage.getItem(this.CONNECTION_KEY);
    if (!conn) {
      // Remove old endpoint key if it exists
      // TODO: Remove this when changing the domain
      if (localStorage.getItem("endpoint")) localStorage.removeItem("endpoint");

      const connStr = JSON.stringify(this.DEFAULT_CONNECTION);
      localStorage.setItem(this.CONNECTION_KEY, connStr);
      conn = connStr;
    }

    return JSON.parse(conn) as Connection;
  }

  static update(params: Connection) {
    const { commitment, endpoint } = params;
    const conn = this.getConnection();

    if (commitment) conn.commitment = commitment;
    if (endpoint) conn.endpoint = endpoint;

    localStorage.setItem(this.CONNECTION_KEY, JSON.stringify(conn));
  }

  static updateWasm(endpoint: string, commitment: string) {
    this.update({
      endpoint: endpoint as Endpoint,
      commitment: commitment as Commitment,
    });
  }
}
