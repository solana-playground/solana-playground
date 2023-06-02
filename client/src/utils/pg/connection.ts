import { Connection, ConnectionConfig } from "@solana/web3.js";

import { createDerivable, declareDerivable, derivable } from "./decorators";
import { OverridableConnection, PgPlaynet } from "./playnet";
import { PgSettings } from "./settings";

const derive = () => ({
  /** Globally sycned connection instance */
  connection: createDerivable({
    // It's important that this method returns immediately because connection
    // instance is used throughout the app. For this reason, the connection for
    // Playnet will be returned without awaiting the initialization. After the
    // initialization, `PgPlaynet.onDidInit` will be triggered and this method
    // will run again to return the overridden connection instance.
    derive: () => {
      // Check whether the endpoint is Playnet
      if (PgPlaynet.isUrlPlaynet(PgSettings.connection.endpoint)) {
        // Return the connection instance if it has been overridden
        if (PgPlaynet.connection?.overridden) {
          return PgPlaynet.connection;
        }

        // Initialize Playnet
        PgPlaynet.init();
      } else {
        // Destroy Playnet
        PgPlaynet.destroy();
      }

      return _PgConnection.create();
    },
    onChange: [
      PgSettings.onDidChangeConnectionEndpoint,
      PgSettings.onDidChangeConnectionCommitment,
      PgPlaynet.onDidInit,
    ],
  }),
});

@derivable(derive)
class _PgConnection {
  /**
   * Create a connection with the given options or defaults from settings.
   *
   * @param opts connection options
   * @returns a new `Connection` instance
   */
  static create(opts?: { endpoint?: string } & ConnectionConfig) {
    return new Connection(
      opts?.endpoint ?? PgSettings.connection.endpoint,
      opts ?? PgSettings.connection.commitment
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
    if (PgPlaynet.isUrlPlaynet(conn.rpcEndpoint)) {
      return conn.overridden;
    }

    return true;
  }
}

export const PgConnection = declareDerivable(_PgConnection, derive);
