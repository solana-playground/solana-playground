import { createCmd, PgTerminal, PgView, PgWallet } from "../../utils/pg";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  run: async (input) => {
    switch (PgWallet.state) {
      case "pg": {
        const isOther = await toggleStandardIfNeeded(input);
        if (!isOther) {
          PgWallet.state = "disconnected";
          PgTerminal.log(PgTerminal.bold("Disconnected."));
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

        const isOther = await toggleStandardIfNeeded(input);
        if (!isOther) {
          await PgWallet.current.disconnect();
          PgWallet.state = "pg";
          PgTerminal.log(
            PgTerminal.bold(`Disconnected from ${PgWallet.current.name}.`)
          );
        }

        break;
      }

      case "disconnected": {
        const isOther = await toggleStandardIfNeeded(input);
        if (!isOther) {
          PgWallet.state = "pg";
          PgTerminal.log(PgTerminal.success("Connected."));
        }

        break;
      }

      case "setup": {
        const { Setup } = await import("../../components/Wallet/Modals/Setup");
        const setupCompleted = await PgView.setModal(Setup);
        if (setupCompleted) {
          const isOther = await toggleStandardIfNeeded(input);
          if (!isOther) PgWallet.state = "pg";

          PgTerminal.log(PgTerminal.success("Setup completed."));
        } else {
          PgTerminal.log(PgTerminal.error("Setup rejected."));
        }
      }
    }
  },
});

/**
 * Connect to or disconnect from a standard wallet based on given input.
 *
 * @param input connect command input
 * @returns whether the connected to a standard wallet
 */
const toggleStandardIfNeeded = async (input: string) => {
  const inputSplit = input.split(/\s/);
  if (inputSplit.length === 1) return false;

  const inputWalletName = inputSplit.slice(1).join(" ");
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
