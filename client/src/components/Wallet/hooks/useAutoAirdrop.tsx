import { useEffect, useRef, useState } from "react";

import { PgCommon, PgConnection, PgTx } from "../../../utils/pg";
import { useBalance, useConnection, useWallet } from "../../../hooks";

/** Request airdrop when necessary. */
export const useAutoAirdrop = () => {
  const { connection } = useConnection();
  const { wallet } = useWallet();

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
        _balance >= 5
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
