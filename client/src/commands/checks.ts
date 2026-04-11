// Common command validation checks

import { PgCommand, PgTerminal, PgWallet } from "../utils";

/** Check whether Playground Wallet is connected and ask to connect if not. */
export const checkPgWallet = async () => {
  if (PgWallet.current?.isPg) return;

  const term = await PgTerminal.get();
  const shouldConnect = await term.waitForUserInput(
    "Playground Wallet is not connected. Would you like to connect?",
    { confirm: true, default: "yes" }
  );
  if (!shouldConnect) {
    throw new Error(
      `${PgTerminal.bold(
        "Playground Wallet"
      )} must be connected to run this command. Run \`${PgTerminal.bold(
        PgCommand.connect.name
      )}\` to connect.`
    );
  }

  await PgCommand.connect.execute();
};
