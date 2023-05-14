import { PgTerminal } from "../terminal";

export class PgClientImporter {
  /**
   * Redefine `console.log` to show mocha logs in the terminal and asynchronously
   * import `PgClient`.
   */
  static async import() {
    // This must happen before `PgClient` is first imported.
    if (!this._isOverridden) console.log = PgTerminal.consoleLog;

    return await import("./client");
  }

  /** Whether `console.log` is overridden */
  private static _isOverridden: boolean;
}
