import { useEffect, useRef, useState } from "react";

import { PgCommon, PgConnection, PgTx, PgWallet } from "../../../utils/pg";
import { useBalance, useConnection, useWallet } from "../../../hooks";

/** Sync the balance of the current wallet and airdrop when necessary. */
export const useAutoAirdrop = () => {
  const { connection } = useConnection();
  const { wallet } = useWallet();

  useEffect(() => {
    if (!PgConnection.isReady(connection) || !wallet) return;

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
  }, [wallet, connection]);

  // Auto airdrop if balance is less than 4 SOL
  const [airdropError, setAirdropError] = useState(false);
  const airdropping = useRef(false);

  const { balance } = useBalance();

  useEffect(() => {
    const airdrop = async (_balance: typeof balance = balance) => {
      if (
        !PgConnection.isReady(connection) ||
        !wallet ||
        airdropping.current ||
        airdropError ||
        _balance === null ||
        _balance >= 4
      ) {
        return;
      }

      // Get cap amount for airdrop based on network
      const airdropAmount = PgCommon.getAirdropAmount(connection.rpcEndpoint);
      if (!airdropAmount) return;

      try {
        airdropping.current = true;

        const txHash = await connection.requestAirdrop(
          wallet.publicKey,
          PgCommon.solToLamports(airdropAmount)
        );
        await PgTx.confirm(txHash, {
          connection: connection,
          commitment: "finalized",
        });
      } catch (e: any) {
        console.log(e.message);
        setAirdropError(true);
      } finally {
        airdropping.current = false;
        _balance = PgCommon.lamportsToSol(
          await connection.getBalance(wallet.publicKey)
        );
        airdrop(_balance);
      }
    };

    airdrop();
  }, [wallet, connection, balance, airdropError]);
};
