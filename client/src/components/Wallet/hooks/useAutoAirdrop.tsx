import { useEffect, useRef } from "react";

import { PgCommon, PgConnection, PgSettings, PgTx } from "../../../utils/pg";
import {
  useBalance,
  useConnection,
  useRenderOnChange,
  useWallet,
} from "../../../hooks";

/** Request airdrop when necessary. */
export const useAutoAirdrop = () => {
  const automaticAirdrop = useRenderOnChange(
    PgSettings.onDidChangeWalletAutomaticAirdrop
  );

  const { connection } = useConnection();
  const { wallet } = useWallet();

  // Auto airdrop if balance is less than 4 SOL
  const airdropping = useRef(false);

  const { balance } = useBalance();

  useEffect(() => {
    const airdrop = async (_balance = balance, airdropError = false) => {
      if (
        !automaticAirdrop ||
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
        airdropError = true;
      } finally {
        airdropping.current = false;
        _balance = PgCommon.lamportsToSol(
          await connection.getBalance(wallet.publicKey)
        );
        airdrop(_balance, airdropError);
      }
    };

    airdrop();
  }, [automaticAirdrop, wallet, connection, balance]);
};
