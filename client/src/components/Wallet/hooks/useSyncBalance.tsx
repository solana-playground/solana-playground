import { useEffect } from "react";

import { useConnection, useWallet } from "../../../hooks";
import { PgCommon, PgConnection, PgWallet } from "../../../utils/pg";

/** Sync the balance of the current wallet. */
export const useSyncBalance = () => {
  const { connection, isConnected } = useConnection();
  const { wallet } = useWallet();

  useEffect(() => {
    if (!PgConnection.isReady(connection) || !wallet) {
      PgWallet.balance = null;
      return;
    }

    // Listen for balance changes
    const id = connection.onAccountChange(wallet.publicKey, (acc) => {
      PgWallet.balance = PgCommon.lamportsToSol(acc.lamports);
    });

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        PgWallet.balance = PgCommon.lamportsToSol(lamports);
      } catch (e: any) {
        console.log("Couldn't fetch balance:", e.message);
        PgWallet.balance = null;
      }
    };

    fetchBalance();

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [wallet, connection, isConnected]);
};
