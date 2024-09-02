import { useEffect } from "react";

import { Endpoint } from "../../../../constants";
import {
  PgCommon,
  PgConnection,
  PgView,
  PgWallet,
  SyncOrAsync,
} from "../../../../utils/pg";

/** Show helpers when there is a connection error with the current endpoint. */
export const useHelpConnection = () => {
  useEffect(() => {
    // Only show each helper once to not be annoying with pop-ups
    const cache = {
      local: false,
      nonLocal: false,
    };
    const executeOnce = async (
      kind: keyof typeof cache,
      cb: () => SyncOrAsync
    ) => {
      if (cache[kind]) return;
      await cb();
      cache[kind] = true;
    };

    const { dispose } = PgCommon.batchChanges(async () => {
      if (cache.local && cache.nonLocal) return;
      if (!PgWallet.current) return;
      if (PgConnection.current.rpcEndpoint === Endpoint.PLAYNET) return;

      const RETRY_AMOUNT = 2;
      for (let i = 0; i < RETRY_AMOUNT; i++) {
        const isClusterDown = await PgConnection.getIsClusterDown();
        if (isClusterDown === false) return;

        // Don't sleep on the last iteration
        if (i !== RETRY_AMOUNT - 1) await PgCommon.sleep(5000);
      }

      // Connection failed
      if (PgConnection.current.rpcEndpoint === Endpoint.LOCALHOST) {
        executeOnce("local", async () => {
          const { Local } = await import("./Local");
          await PgView.setModal(Local);
        });
      } else {
        executeOnce("nonLocal", async () => {
          const { NonLocal } = await import("./NonLocal");
          PgView.setToast(NonLocal, {
            options: { autoClose: false, closeOnClick: true },
          });
        });
      }
    }, [PgConnection.onDidChange, PgWallet.onDidChangeCurrent]);

    return () => dispose();
  }, []);
};
