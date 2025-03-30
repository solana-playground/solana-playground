import { format } from "util";

import { Emoji } from "../../../constants";
import { PgTerminal } from "../terminal";

export class PgClientImporter {
  /** Whether `console.log` is overridden */
  private static _isOverridden: boolean;
  /** The default `console.log` */
  private static _consoleLog = console.log;

  /**
   * Redefine `console.log` to show `mocha` logs in the terminal and
   * asynchronously import `PgClient`.
   */
  static async import() {
    if (!this._isOverridden) {
      // Overriding needs to happen before the client is imported
      console.log = (msg, ...rest) => {
        this._consoleLog(msg, ...rest);

        if (msg !== undefined) {
          // We only want to print `mocha` logs in the terminal
          const fullMessage = format(msg, ...rest);
          if (fullMessage.startsWith("  ")) {
            const editedMessage = fullMessage
              // Replace checkmark icon
              .replace(Emoji.CHECKMARK, PgTerminal.success("✔ "))
              // Make '1) testname' red
              .replace(/\s+\d\)\s\w*$/, PgTerminal.error)
              // Passing text
              .replace(/\d+\spassing/, PgTerminal.success)
              // Failing text
              .replace(/\d+\sfailing/, PgTerminal.error)
              // Don't show the stack trace because it shows the transpiled code
              // TODO: show where the error actually happened in user code
              .replace(/\s+at.*$/gm, "");

            PgTerminal.println(editedMessage);
          }
        }
      };
      this._isOverridden = true;
    }

    return await import("./client");
  }
}
