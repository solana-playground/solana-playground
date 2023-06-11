import { createCmd } from "../create-command";
import { PgTerminal } from "../../terminal";
import { PgView } from "../../view";
import { PgWallet } from "../../wallet";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  run: async (input) => {
    switch (PgWallet.state) {
      case "pg": {
        const isOther = await connectStandardIfNeeded(input);
        if (!isOther) {
          PgWallet.state = "disconnected";
          PgTerminal.log(PgTerminal.bold("Disconnected."));
        }

        break;
      }

      case "sol": {
        if (!PgWallet.current || PgWallet.current.isPg) {
          throw new Error("Current wallet is not a Solana wallet");
        }

        await PgWallet.current.disconnect();
        PgWallet.state = "pg";
        PgTerminal.log(
          PgTerminal.bold(`Disconnected from ${PgWallet.current.name}.`)
        );
        PgTerminal.log(PgTerminal.success("Connected to Playground Wallet."));
        break;
      }

      case "disconnected": {
        const isOther = await connectStandardIfNeeded(input);
        if (!isOther) {
          PgWallet.state = "pg";
          PgTerminal.log(PgTerminal.success("Connected."));
        }

        break;
      }

      case "setup": {
        const { Setup } = await import(
          "../../../../components/Wallet/Modals/Setup"
        );
        const setupCompleted = await PgView.setModal(Setup);
        if (setupCompleted) {
          const isOther = await connectStandardIfNeeded(input);
          if (!isOther) PgWallet.state = "pg";

          PgTerminal.log(PgTerminal.success("Setup completed."));
        } else {
          PgTerminal.log(PgTerminal.error("Setup rejected."));
        }
      }
    }
  },
});

const connectStandardIfNeeded = async (input: string) => {
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

  // Set the other wallet name to derive the standard wallet
  PgWallet.standardName = walletName;

  await wallet.adapter.connect();
  PgWallet.state = "sol";

  PgTerminal.log(PgTerminal.success(`Connected to ${walletName}.`));

  return true;
};
