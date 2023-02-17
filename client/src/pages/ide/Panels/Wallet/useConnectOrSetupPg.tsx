import { useCallback } from "react";
import { useAtom } from "jotai";

import Setup from "./Setup";
import { pgWalletAtom, refreshPgWalletAtom } from "../../../../state";
import { PgModal, PgTerminal, PgWallet } from "../../../../utils/pg";

export const useConnectOrSetupPg = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged, refresh] = useAtom(refreshPgWalletAtom);

  // Pg wallet should always be connected except first time ever
  const handleConnectPg = useCallback(() => {
    PgTerminal.process(async () => {
      const setupCompleted = PgWallet.getLs()?.setupCompleted;
      if (!setupCompleted) {
        await PgModal.set(() => <Setup onSubmit={handleConnectPg} />);
      } else {
        pgWallet.connected = !pgWallet.connected;
        PgWallet.update({ connected: pgWallet.connected });
        refresh();
        PgTerminal.log(
          pgWallet.connected
            ? PgTerminal.success("Connected.")
            : PgTerminal.bold("Disconnected.")
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgWalletChanged]);

  return { handleConnectPg };
};
