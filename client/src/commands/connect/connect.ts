import { PgCommon, PgTerminal, PgView, PgWallet } from "../../utils/pg";
import { createArgs, createCmd } from "../create";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  args: createArgs([
    {
      name: "wallet",
      optional: true,
      values: () =>
        PgWallet.standardWallets.map((w) => w.adapter.name.toLowerCase()),
    },
  ]),
  run: async (input) => {
    switch (PgWallet.state) {
      case "pg": {
        const isOther = await toggleStandardIfNeeded(input.args.wallet);
        if (!isOther) {
          PgWallet.state = "disconnected";
          PgTerminal.log(PgTerminal.bold("Disconnected."));
        }

        await confirmDisconnect();
        return true;
      }

      case "sol": {
        if (!PgWallet.current) {
          throw new Error("Not connected");
        }
        if (PgWallet.current.isPg) {
          throw new Error("Current wallet is not a Solana wallet");
        }

        const isOther = await toggleStandardIfNeeded(input.args.wallet);
        if (!isOther) {
          await PgWallet.current.disconnect();
          PgWallet.state = "pg";
          PgTerminal.log(
            PgTerminal.bold(`Disconnected from ${PgWallet.current.name}.`)
          );
        }

        await confirmDisconnect();
        return true;
      }

      case "disconnected": {
        const isOther = await toggleStandardIfNeeded(input.args.wallet);
        if (!isOther) {
          PgWallet.state = "pg";
          PgTerminal.log(PgTerminal.success("Connected."));
        }

        await confirmConnect();
        return true;
      }

      case "setup": {
        const { Setup } = await import("../../components/Wallet/Modals/Setup");
        const setupCompleted = await PgView.setModal<boolean>(Setup);
        if (setupCompleted) {
          const isOther = await toggleStandardIfNeeded(input.args.wallet);
          if (!isOther) PgWallet.state = "pg";

          PgTerminal.log(PgTerminal.success("Setup completed."));
          await confirmConnect();
        } else {
          PgTerminal.log(PgTerminal.error("Setup rejected."));
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
 * @returns whether the connected to a standard wallet
 */
const toggleStandardIfNeeded = async (inputWalletName: string | undefined) => {
  if (!inputWalletName) return false;

  const wallet = PgWallet.standardWallets.find((wallet) => {
    return wallet.adapter.name.toLowerCase() === inputWalletName.toLowerCase();
  });
  if (!wallet) {
    throw new Error(`Given wallet '${inputWalletName}' is not detected`);
  }

  // The given wallet name could be different, e.g. lowercase
  const walletName = wallet.adapter.name;

  // Check whether the wallet is already connected
  if (!wallet.adapter.connected) {
    await wallet.adapter.connect();

    // Set the standard wallet name to derive the standard wallet
    PgWallet.standardName = walletName;
    PgWallet.state = "sol";

    PgTerminal.log(PgTerminal.success(`Connected to ${walletName}.`));
  } else {
    await wallet.adapter.disconnect();
    PgWallet.state = "pg";
    PgTerminal.log(PgTerminal.bold(`Disconnected from ${walletName}.`));
  }

  return true;
};

/** Wait until the wallet is connected. */
const confirmConnect = async () => {
  await PgCommon.tryUntilSuccess(() => {
    if (!PgWallet.current) throw new Error();
  }, 50);
};

/** Wait until the wallet is disconnected. */
const confirmDisconnect = async () => {
  await PgCommon.tryUntilSuccess(() => {
    if (PgWallet.current) throw new Error();
  }, 50);
};
