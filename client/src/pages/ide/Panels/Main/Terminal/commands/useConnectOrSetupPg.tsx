import { useCallback } from "react";
import { useAtom } from "jotai";

import Setup from "../../../../../../components/Wallet/Modals/Setup";
import { refreshPgWalletAtom } from "../../../../../../state";
import { PgModal, PgTerminal, PgWallet } from "../../../../../../utils/pg";

export const useConnectOrSetupPg = () => {
  const [, refresh] = useAtom(refreshPgWalletAtom);

  // Pg wallet should always be connected except first time ever
  const handleConnectPg = useCallback(async () => {
    const setupCompleted = PgWallet.getLs()?.setupCompleted;
    if (!setupCompleted) {
      await PgModal.set(() => <Setup />);
    } else {
      const wallet = await PgWallet.get();
      wallet.setConnected(!wallet.connected);
      refresh();

      PgTerminal.log(
        wallet.connected
          ? PgTerminal.success("Connected.")
          : PgTerminal.bold("Disconnected.")
      );
    }
  }, [refresh]);

  return { handleConnectPg };
};
