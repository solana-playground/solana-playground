import { PgCommon, PgTerminal, PgView, PgWallet } from "../../utils";
import { createArgs, createCmd } from "../create";

export const connect = createCmd({
  name: "connect",
  description: "Manage wallet connection",
  args: createArgs([
    {
      name: "wallet",
      optional: true,
      values: () => PgWallet.standardWallets.map((w) => w.name.toLowerCase()),
    },
  ]),
  handle: async (input) => {
    switch (PgWallet.state) {
      case "pg": {
        const { changed } = await toggleStandardIfNeeded(input.args.wallet);
        if (!changed) {
          PgWallet.state = "disconnected";
          PgTerminal.println(PgTerminal.bold("Disconnected."));
          await confirm(() => !PgWallet.current);
        } else {
          await confirm(() => PgWallet.current);
        }

        break;
      }

      case "sol": {
        if (!PgWallet.current) {
          throw new Error("Not connected");
        }
        if (PgWallet.current.isPg) {
          throw new Error("Current wallet is not a Solana wallet");
        }

        const { changed } = await toggleStandardIfNeeded(input.args.wallet);
        if (!changed) {
          await PgWallet.current.disconnect();
          PgWallet.state = "pg";
          PgTerminal.println(
            PgTerminal.bold(`Disconnected from ${PgWallet.current.name}.`)
          );
          await confirm(() => PgWallet.current?.isPg);
        } else {
          await confirm(() => PgWallet.current && !PgWallet.current.isPg);
        }

        break;
      }

      case "disconnected": {
        const { changed } = await toggleStandardIfNeeded(input.args.wallet);
        if (!changed) {
          PgWallet.state = "pg";
          PgTerminal.println(PgTerminal.success("Connected."));
          await confirm(() => PgWallet.current?.isPg);
        } else {
          await confirm(() => PgWallet.current && !PgWallet.current.isPg);
        }

        break;
      }

      case "setup": {
        const { Setup } = await import("../../components/Wallet/Modals/Setup");
        const setupCompleted = await PgView.setModal<boolean>(Setup);
        if (!setupCompleted) throw new Error("Setup rejected.");

        const { changed } = await toggleStandardIfNeeded(input.args.wallet);
        if (!changed) PgWallet.state = "pg";

        PgTerminal.println(PgTerminal.success("Setup completed."));
        await confirm(() => PgWallet.current?.isPg);
      }
    }
  },
});

/**
 * Connect to or disconnect from a standard wallet based on given input.
 *
 * @param walletName wallet name from the command input (lower case)
 * @returns whether the current wallet has changed
 */
const toggleStandardIfNeeded = async (walletName: string | undefined) => {
  if (!walletName) return { changed: false };

  const wallet = PgWallet.standardWallets.find(
    (wallet) => wallet.name.toLowerCase() === walletName
  );
  if (!wallet) {
    throw new Error(`Given wallet '${walletName}' is not detected`);
  }

  if (!wallet.connected) {
    await wallet.connect();
    PgWallet.update({ state: "sol", standardName: wallet.name });
    PgTerminal.println(PgTerminal.success(`Connected to ${wallet.name}.`));
  } else {
    await wallet.disconnect();
    PgWallet.update({ state: "pg", standardName: null });
    PgTerminal.println(PgTerminal.bold(`Disconnected from ${wallet.name}.`));
  }

  return { changed: true };
};

/**
 * Confirm generic wallet connection state.
 *
 * This function will resolve once `check` returns a truthy value or on timeout.
 */
const confirm = async (check: () => any) => {
  const MAX_DURATION = 5000;
  const TRY_INTERVAL = 50;

  for (let i = 0; i * TRY_INTERVAL < MAX_DURATION; i++) {
    if (check()) return;
    await PgCommon.sleep(TRY_INTERVAL);
  }

  throw new Error("Failed to confirm wallet connection state");
};
