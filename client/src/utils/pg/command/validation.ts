import { PgCommand } from "./command";
import { PgTerminal } from "../terminal";
import { PgWallet } from "../wallet";

/** Common command checks */
export class PgCommandValidation {
  /** Check Playground Wallet connection */
  static isPgConnected() {
    if (!PgWallet.isConnected) {
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
