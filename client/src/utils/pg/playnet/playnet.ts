import { TransactionStatus } from "@solana-playground/playnet";
import {
  BlockheightBasedTransactionConfirmationStrategy,
  Connection,
} from "@solana/web3.js";

import { Endpoint } from "../../../constants";
import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgExplorer } from "../explorer";
import { PgPackage } from "../terminal";
import { PgPlaynetRpc } from "./rpc";
import { PgPlaynetUtils } from "./utils";
import { OverrideableConnection } from "./types";

export class PgPlaynet {
  /**
   * Initialize Playnet instance and apply the necessary changes for the client
   * to interact with the Playnet via JSON-RPC endpoints
   */
  static async init() {
    if (this._playnet) return;

    // Get the saved data from IndexedDB
    const saveData = await this._getSaveData();

    // Only load when Playnet needs to get initialized
    const { Playnet } = await PgPackage.import("playnet");
    const playnet = new Playnet(saveData);
    this._playnet = playnet;

    // Override fetch function for both `window` and `ConnectionProvider`
    const newFetch = PgPlaynetRpc.overrideFetch(this._playnet);

    // Add a small delay because overriding `fetch` results in a new `Connection`
    // object which results in `usePgConnectionStatic` sets the new connection
    // object and this should happen before we are overriding the new object
    // with `PgConnection.set`
    await PgCommon.sleep(100);

    // Override connection to make it compatible with Playnet
    PgConnection.set(() => {
      // Creating a new connection object to trigger re-render after this callback
      const newConnection: OverrideableConnection =
        PgConnection.createConnection({ fetch: newFetch });

      // @ts-ignore
      newConnection.confirmTransaction = async (
        ...params: Parameters<Connection["confirmTransaction"]>
      ) => {
        let signature;
        if (typeof params[0] === "string") {
          signature = params[0];
        } else {
          const strat =
            params[0] as BlockheightBasedTransactionConfirmationStrategy;
          signature = strat.signature;
        }

        const result = playnet.rpc.getSignatureStatuses([signature]);
        const status: TransactionStatus | undefined = result.statuses()[0];
        if (!status) {
          throw new Error("Transaction not found.");
        }

        return {
          value: { err: status.error() ?? null },
          context: { slot: PgCommon.bigintToInt(playnet.rpc.getSlot()) },
        };
      };

      // @ts-ignore
      newConnection.onAccountChange = (
        ...params: Parameters<Connection["onAccountChange"]>
      ) => {
        const address = params[0].toBase58();
        const cb = params[1];

        let currentAccountInfo = PgPlaynetUtils.convertAccountInfo(
          playnet.rpc.getAccountInfo(address)
        );

        const id = PgCommon.setIntervalOnFocus(() => {
          const newAccountInfo = PgPlaynetUtils.convertAccountInfo(
            playnet.rpc.getAccountInfo(address)
          );

          if (!PgCommon.isEqual(currentAccountInfo, newAccountInfo)) {
            cb(newAccountInfo, {
              slot: PgCommon.bigintToInt(playnet.rpc.getSlot()),
            });

            currentAccountInfo = newAccountInfo;
          }
        }, 3000);

        return id;
      };

      newConnection.removeAccountChangeListener = async (
        ...params: Parameters<Connection["removeAccountChangeListener"]>
      ) => {
        const [id] = params;
        clearInterval(id);
      };

      // `Connection` is not ready until this property is set.
      newConnection.overridden = true;

      return newConnection;
    });

    // Save Playnet data periodically
    this._SAVE_INTERVAL_ID = PgCommon.setIntervalOnFocus(() => {
      this._save();
    }, this._SAVE_INTERVAL_MS);
  }

  /**
   * Destroy the Playnet instance by:
   * 1. Clear save interval.
   * 2. Save data.
   * 3. Set `connection` to default.
   * 4. Set `fetch` to default.
   * 5. Free WASM memory.
   */
  static async destroy() {
    if (!this._playnet) return;

    // Clear save interval
    if (this._SAVE_INTERVAL_ID) {
      clearInterval(this._SAVE_INTERVAL_ID);
    }

    // Save Playnet instance data
    await this._save();

    // Set the connection to default
    PgConnection.set(PgConnection.createConnection());

    // Set fetch to default
    PgPlaynetRpc.overrideFetch();

    // Free memory
    this._playnet.free();
    this._playnet = null;
  }

  /**
   * Get whether the given url belong to Playnet
   *
   * @param url RPC endpoint
   * @returns whether the given URL or the URL in localStorage is `Endpoint.PLAYNET`
   */
  static isUrlPlaynet(url?: string) {
    if (url) {
      return url === Endpoint.PLAYNET;
    }

    return PgConnection.endpoint === Endpoint.PLAYNET;
  }

  /** Static Playnet instance */
  private static _playnet: import("@solana-playground/playnet").Playnet | null =
    null;

  /** Playnet related paths in fs */
  private static _PATHS = {
    DIR: PgCommon.joinPaths([PgExplorer.PATHS.ROOT_DIR_PATH, ".playnet"]),
    get SAVE_DATA() {
      return PgCommon.joinPaths([this.DIR, "data.json"]);
    },
  };

  /** Save the Playnet instance data to IndexedDB at this interval */
  private static _SAVE_INTERVAL_MS = 30 * 1000;

  /** Data saving interval that must be cleared while destroying the Playnet instance */
  private static _SAVE_INTERVAL_ID: NodeJS.Timer | null = null;

  /** Save the current playnet data */
  private static async _save() {
    if (!this._playnet) return;

    try {
      await PgExplorer.run({
        newItem: [
          this._PATHS.SAVE_DATA,
          this._playnet.getSaveData(),
          {
            openOptions: {
              dontOpen: true,
            },
            override: true,
            skipNameValidation: true,
          },
        ],
      });
    } catch (e: any) {
      console.log("Couldn't save Playnet data:", e.message);
    }
  }

  /**
   * Get the saved data from IndexedDB
   *
   * @returns saved data as `string` or `undefined` if it doesn't exist
   */
  private static async _getSaveData() {
    try {
      const explorer = await PgExplorer.get();
      return await explorer.readToString(this._PATHS.SAVE_DATA);
    } catch (e: any) {
      console.log("Couldn't get Playnet data:", e.message);
    }
  }
}
