import { PgTerminal } from "../terminal";

export class PgClientImporter {
  /**
   * Redefine `console.log` to show mocha logs in the terminal and asynchronously
   * import `PgClient`.
   */
  static async import() {
    if (!this._isOverridden) {
      // Override the `console.log` before the initial `PgClient` import
      console.log = PgTerminal.consoleLog;
      this._isOverridden = true;
    }

    return await import("./client");
  }

  /** Whether `console.log` is overridden */
  private static _isOverridden: boolean;
}
