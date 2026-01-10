// Common command checks

import { PgCommand, PgTerminal, PgWallet } from "../utils";

/** Check whether Playground Wallet is connected. */
export const isPgConnected = () => {
  if (!PgWallet.current?.isPg) {
    throw new Error(
      `${PgTerminal.bold(
        "Playground Wallet"
      )} must be connected to run this command. Run '${PgTerminal.bold(
        PgCommand.connect.name
      )}' to connect.`
    );
  }
};
