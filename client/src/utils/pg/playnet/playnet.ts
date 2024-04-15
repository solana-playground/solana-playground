import { PgPlaynetRpc } from "./rpc";
import { PgCommon } from "../common";
import { PgExplorer } from "../explorer";
import { PgPackage } from "../package";
import { EventName } from "../../../constants";
import type { OverridableConnection } from "./types";

export class PgPlaynet {
  /** Overridable Playnet connection */
  static connection: OverridableConnection | null;

  /**
   * Initialize Playnet and apply the necessary changes for the client to be
   * able to interact with Playnet via JSON-RPC endpoints.
   *
   * This method returns early if Playnet instance already exists.
   */
  static async init() {
    if (this._playnet) return;

    // Get the saved data from IndexedDB
    const saveData = await this._getSaveData();

    // Only load when Playnet needs to get initialized
    const { Playnet } = await PgPackage.import("playnet");
    const playnet = new Playnet(saveData);
    this._playnet = playnet;

    // Override `fetch` and `connection`
    this.connection = PgPlaynetRpc.overrideConnection(this._playnet.rpc);

    // Dispatch `init` event to create a new connection object
    PgCommon.createAndDispatchCustomEvent(EventName.PLAYNET_ON_DID_INIT);

    // Save Playnet data periodically
    this._SAVE_INTERVAL_ID = PgCommon.setIntervalOnFocus(() => {
      this._save();
    }, this._SAVE_INTERVAL_MS);
  }

  /**
   * Destroy the Playnet instance by:
   * 1. Clear save interval.
   * 2. Save data.
   * 3. Set `connection`and `fetch` to default.
   * 4. Free WASM memory.
   *
   * This method returns early if Playnet instance doesn't exist.
   */
  static async destroy() {
    if (!this._playnet) return;

    // Clear save interval
    if (this._SAVE_INTERVAL_ID) {
      clearInterval(this._SAVE_INTERVAL_ID);
    }

    // Save Playnet instance data
    await this._save();

    // Reset to defaults
    this.connection = PgPlaynetRpc.overrideConnection();

    // Free memory
    this._playnet.free();
    this._playnet = null;
  }

  /** {@link PgPlaynetRpc.isUrlPlaynet} */
  static isUrlPlaynet = PgPlaynetRpc.isUrlPlaynet;

  /**
   * @param cb callback function to run after Playnet has been initialialized
   * @returns a dispose function to clear the event
   */
  static onDidInit(cb: () => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.PLAYNET_ON_DID_INIT,
    });
  }

  /** Static Playnet instance */
  private static _playnet: import("@solana-playground/playnet").Playnet | null =
    null;

  /** Playnet related paths in fs */
  private static _PATHS = {
    DIR: PgCommon.joinPaths(PgExplorer.PATHS.ROOT_DIR_PATH, ".playnet"),
    get SAVE_DATA() {
      return PgCommon.joinPaths(this.DIR, "data.json");
    },
  };

  /** Save the Playnet instance data to IndexedDB at this interval */
  private static _SAVE_INTERVAL_MS = 30 * 1000;

  /** Data saving interval that must be cleared while destroying the Playnet instance */
  private static _SAVE_INTERVAL_ID: NodeJS.Timer | null;

  /** Save the current playnet data */
  private static async _save() {
    if (!this._playnet) return;

    try {
      await PgExplorer.fs.writeFile(
        this._PATHS.SAVE_DATA,
        this._playnet.getSaveData(),
        { createParents: true }
      );
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
      return await PgExplorer.fs.readToString(this._PATHS.SAVE_DATA);
    } catch (e: any) {
      console.log("Couldn't get Playnet data:", e.message);
    }
  }
}
