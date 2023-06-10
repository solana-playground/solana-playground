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
      return await PgView.setModal(Setup);
    }

    if (PgWallet.current) {
      if (!PgWallet.current.isPg) {
        await PgWallet.current.disconnect();
      }

      PgWallet.connectionState = null;
      PgTerminal.log(PgTerminal.bold("Disconnected."));
    } else {
      PgWallet.connectionState = "pg";
      PgTerminal.log(PgTerminal.success("Connected."));
    }
  },
});
