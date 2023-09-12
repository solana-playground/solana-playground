import { useEffect } from "react";

import { Endpoint } from "../../../../constants";
import { PgCommon, PgConnection, PgView, PgWallet } from "../../../../utils/pg";

/** Show helpers when there is a connection error with the current endpoint. */
export const useHelpConnection = () => {
  useEffect(() => {
    // Only show this helper once to not be annoying with pop-ups
    const helperCache = {
      local: false,
      nonLocal: false,
    };

    const { dispose } = PgCommon.batchChanges(async () => {
      if (helperCache.local && helperCache.nonLocal) return;
      if (!PgWallet.current) return;
      if (PgConnection.current.rpcEndpoint === Endpoint.PLAYNET) return;

      const RETRY_AMOUNT = 2;
      for (let i = 0; i < RETRY_AMOUNT; i++) {
        const isConnected = await PgConnection.getIsConnected();
        if (isConnected) return;

        // Don't sleep on the last iteration
        if (i !== RETRY_AMOUNT - 1) await PgCommon.sleep(5000);
      }

      // Connection failed
      if (PgConnection.current.rpcEndpoint === Endpoint.LOCALHOST) {
        if (helperCache.local) return;

        const { Local } = await import("./Local");
        await PgView.setModal(Local);

        helperCache.local = true;
      } else {
        if (helperCache.nonLocal) return;

        const { NonLocal } = await import("./NonLocal");
        PgView.setToast(NonLocal, {
          options: { autoClose: false, closeOnClick: true },
        });

        helperCache.nonLocal = true;
      }
    }, [PgConnection.onDidChange, PgWallet.onDidChangeCurrent]);

    return () => dispose();
  }, []);
};
