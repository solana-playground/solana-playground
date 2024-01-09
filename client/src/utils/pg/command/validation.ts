import { PgCommand } from "./command";
import { PgTerminal } from "../terminal";
import { PgWallet } from "../wallet";

/** Common command checks */
export class PgCommandValidation {
  /** Check whether Playground Wallet is connected. */
  static isPgConnected() {
    if (!PgWallet.current?.isPg) {
      throw new Error(
        `${PgTerminal.bold(
          "Playground Wallet"
        )} must be connected to run this command. Run '${PgTerminal.bold(
          PgCommand.connect.name
        )}' to connect.`
      );
    }
  }
}
