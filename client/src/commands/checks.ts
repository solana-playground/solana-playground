// Common command validation checks

import { PgCommand, PgTerminal, PgWallet } from "../utils";

/** Check whether Playground Wallet is connected and ask to connect if not. */
export const checkPgWallet = async () => {
  if (!PgWallet.current?.isPg) await connect("Playground Wallet");
};

/** Check whether any wallet is connected and ask to connect if not. */
export const checkWallet = async () => {
  if (!PgWallet.current) await connect("Wallet");
};

const connect = async (name: "Playground Wallet" | "Wallet") => {
  const term = await PgTerminal.get();
  const shouldConnect = await term.waitForUserInput(
    `${name} is not connected. Would you like to connect?`,
    { confirm: true, default: "yes" }
  );
  if (!shouldConnect) {
    throw new Error(
      `${name} must be connected to run this command. Run \`${PgTerminal.bold(
        PgCommand.connect.name
      )}\` to connect.`
    );
  }

  await PgCommand.connect.execute();
};
