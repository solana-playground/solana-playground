import { useCallback } from "react";

import Setup from "../../../../../../components/Wallet/Modals/Setup";
import { PgTerminal, PgView, PgWallet } from "../../../../../../utils/pg";

export const useConnectOrSetupPg = () => {
  const handleConnectPg = useCallback(async () => {
    if (!PgWallet.isSetupCompleted) {
      await PgView.setModal(() => <Setup />);
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
  }, []);

  return { handleConnectPg };
};
