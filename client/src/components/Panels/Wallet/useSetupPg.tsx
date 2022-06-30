import { useCallback } from "react";
import { useAtom } from "jotai";

import Setup from "./Setup";
import { modalAtom, pgWalletAtom, refreshPgWalletAtom } from "../../../state";
import { PgWallet } from "../../../utils/pg";

export const useSetupPg = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged, refresh] = useAtom(refreshPgWalletAtom);
  const [, setModal] = useAtom(modalAtom);

  // Pg wallet should always be connected except first time ever
  const handleConnectPg = useCallback(() => {
    const setupCompleted = PgWallet.getLs()?.setupCompleted;
    if (!setupCompleted) setModal(<Setup onSubmit={handleConnectPg} />);
    else {
      pgWallet.connected = !pgWallet.connected;
      PgWallet.update({ connected: pgWallet.connected });
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgWalletChanged]);

  return { handleConnectPg };
};
