import { useEffect } from "react";

import { Endpoint } from "../../../../constants";
import { PgCommon, PgConnection, PgView, PgWallet } from "../../../../utils/pg";

/** Show helpers when there is a connection error with the current endpoint. */
export const useHelpConnection = () => {
  useEffect(() => {
    const { dispose } = PgCommon.batchChanges(async () => {
      if (!PgWallet.current) return;

      const connection = PgConnection.current;
      if (connection.rpcEndpoint === Endpoint.PLAYNET) return;

      const RETRY_AMOUNT = 2;
      for (let i = 0; i < RETRY_AMOUNT; i++) {
        try {
          await connection.getVersion();
          // Connection successful
          return;
        } catch {
          // Don't sleep on the last iteration
          if (i !== RETRY_AMOUNT - 1) await PgCommon.sleep(5000);
        }
      }

      // Connection failed
      if (connection.rpcEndpoint === Endpoint.LOCALHOST) {
        const { Local } = await import("./Local");
        await PgView.setModal(Local);
      } else {
        const { NonLocal } = await import("./NonLocal");
        PgView.setToast(NonLocal, {
          options: { autoClose: false, closeOnClick: true },
        });
      }
    }, [PgConnection.onDidChangeCurrent, PgWallet.onDidChangeCurrent]);

    return () => dispose();
  }, []);
};
