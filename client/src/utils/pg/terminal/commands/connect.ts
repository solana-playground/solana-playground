import { createCmd } from "./_command";
import { PgView } from "../../view";
import { PgWallet } from "../../wallet";
import { PgTerminal } from "../terminal";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  process: async () => {
    if (!PgWallet.isSetupCompleted) {
      const { default: Setup } = await import(
        "../../../../components/Wallet/Modals/Setup"
      );
      await PgView.setModal(Setup);
    } else {
      PgWallet.update({
        connected: !PgWallet.isConnected,
      });

      PgTerminal.log(
        PgWallet.isConnected
          ? PgTerminal.success("Connected.")
          : PgTerminal.bold("Disconnected.")
      );
    }
  },
});
