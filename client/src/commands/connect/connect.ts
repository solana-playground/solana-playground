import { PgCommon, PgTerminal, PgView, PgWallet } from "../../utils";
import { createArgs, createCmd } from "../create";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
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

        return true;
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

        return true;
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

        return true;
      }

      case "setup": {
        const { Setup } = await import("../../components/Wallet/Modals/Setup");
        const setupCompleted = await PgView.setModal<boolean>(Setup);
        if (setupCompleted) {
          const { changed } = await toggleStandardIfNeeded(input.args.wallet);
          if (!changed) PgWallet.state = "pg";

          PgTerminal.println(PgTerminal.success("Setup completed."));
          await confirm(() => PgWallet.current?.isPg);
        } else {
          PgTerminal.println(PgTerminal.error("Setup rejected."));
        }

        return !!setupCompleted;
      }
    }
  },
});

/**
 * Connect to or disconnect from a standard wallet based on given input.
 *
 * @param inputWalletName wallet name from the command input
 * @returns whether the current wallet has changed
 */
const toggleStandardIfNeeded = async (inputWalletName: string | undefined) => {
  if (!inputWalletName) return { changed: false };

  const wallet = PgWallet.standardWallets.find((wallet) => {
    return wallet.name.toLowerCase() === inputWalletName.toLowerCase();
  });
  if (!wallet) {
    throw new Error(`Given wallet '${inputWalletName}' is not detected`);
  }

  // The given wallet name could be different, e.g. lowercase
  const walletName = wallet.name;

  // Check whether the wallet is already connected
  if (!wallet.connected) {
    await wallet.connect();

    // Set the standard wallet name to derive the standard wallet
    PgWallet.standardName = walletName;
    PgWallet.state = "sol";

    PgTerminal.println(PgTerminal.success(`Connected to ${walletName}.`));
  } else {
    await wallet.disconnect();
    PgWallet.state = "pg";
    PgTerminal.println(PgTerminal.bold(`Disconnected from ${walletName}.`));
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
