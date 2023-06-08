import { createCmd } from "../create-command";
import { PgTerminal } from "../../terminal";
import { PgView } from "../../view";
import { PgWallet } from "../../wallet";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  run: async () => {
    if (!PgWallet.isSetupCompleted) {
      const { Setup } = await import(
        "../../../../components/Wallet/Modals/Setup"
      );
      await PgView.setModal(Setup);
    } else {
      PgWallet.isConnected = !PgWallet.isConnected;

      PgTerminal.log(
        PgWallet.isConnected
          ? PgTerminal.success("Connected.")
          : PgTerminal.bold("Disconnected.")
      );
    }
  },
});
