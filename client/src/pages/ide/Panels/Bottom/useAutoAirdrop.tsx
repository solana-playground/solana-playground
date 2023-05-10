import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { PublicKey } from "@solana/web3.js";

import { uiBalanceAtom } from "../../../../state";
import { PgCommon, PgConnection, PgTx, PgWallet } from "../../../../utils/pg";
import {
  useAirdropAmount,
  useAsyncEffect,
  useCurrentWallet,
  usePgConnection,
} from "../../../../hooks";

export const useAutoAirdrop = () => {
  const [balance] = useAtom(uiBalanceAtom);

  const { connection: conn } = usePgConnection();
  const { walletPkStr, pgWalletPk } = useCurrentWallet();
  const pgWalletPkStr = pgWalletPk?.toBase58();

  useAsyncEffect(async () => {
    if (!PgConnection.isReady(conn) || !walletPkStr) return;

    const currentPk = new PublicKey(walletPkStr);

    // Listen for balance changes
    const id = conn.onAccountChange(currentPk, (acc) => {
      PgWallet.setUIBalance(PgCommon.lamportsToSol(acc.lamports));
    });

    const fetchBalance = async () => {
      const lamports = await conn.getBalance(currentPk);
      PgWallet.setUIBalance(PgCommon.lamportsToSol(lamports));
    };

    try {
      await fetchBalance();
    } catch (e: any) {
      console.log("Couldn't fetch balance:", e.message);
    }

    return () => {
      conn.removeAccountChangeListener(id);
    };
  }, [walletPkStr, conn]);

  // Auto airdrop if balance is less than 4 SOL
  const [airdropError, setAirdropError] = useState(false);
  const airdropAmount = useAirdropAmount();
  const airdropping = useRef(false);

  useEffect(() => {
    const airdrop = async (_balance: number | null = balance) => {
      if (
        !PgConnection.isReady(conn) ||
        airdropping.current ||
        airdropError ||
        !airdropAmount ||
        _balance === undefined ||
        _balance === null ||
        _balance >= 4 ||
        !pgWalletPkStr
      ) {
        return;
      }

      const pgWalletPk = new PublicKey(pgWalletPkStr);

      try {
        airdropping.current = true;

        const txHash = await conn.requestAirdrop(
          pgWalletPk,
          PgCommon.solToLamports(airdropAmount)
        );
        await PgTx.confirm(txHash, conn, "finalized");
      } catch (e: any) {
        console.log(e.message);
        setAirdropError(true);
      } finally {
        airdropping.current = false;
        _balance = PgCommon.lamportsToSol(await conn.getBalance(pgWalletPk));
        airdrop(_balance);
      }
    };

    airdrop();
  }, [balance, pgWalletPkStr, airdropError, airdropAmount, conn]);

  return { balance };
};
