import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";

import { uiBalanceAtom } from "../../../state";
import { PgCommon, PgConnection, PgTx } from "../../../utils/pg";
import { usePgConnection } from "../../../hooks";
import { useAirdropAmount, useCurrentWallet } from "../Wallet";

export const useAutoAirdrop = () => {
  const [balance, setBalance] = useAtom(uiBalanceAtom);

  const { connection: conn } = usePgConnection();
  const { currentWallet, pgWalletPk } = useCurrentWallet();

  useEffect(() => {
    if (!currentWallet || !PgConnection.isReady(conn)) return;

    const fetchBalance = async () => {
      const lamports = await conn.getBalance(currentWallet.publicKey);
      setBalance(PgCommon.lamportsToSol(lamports));
    };

    fetchBalance().catch((e) =>
      console.log("Couldn't fetch balance:", e.message)
    );

    // Listen for balance changes
    const id = conn.onAccountChange(currentWallet.publicKey, (acc) => {
      setBalance(PgCommon.lamportsToSol(acc.lamports));
    });

    return () => {
      conn.removeAccountChangeListener(id);
    };
  }, [currentWallet, conn, setBalance]);

  // Auto airdrop if balance is less than 4 SOL
  const airdropAmount = useAirdropAmount();
  const [rateLimited, setRateLimited] = useState(false);

  const airdropping = useRef(false);

  useEffect(() => {
    const airdrop = async (_balance: number | null = balance) => {
      if (
        !PgConnection.isReady(conn) ||
        airdropping.current ||
        rateLimited ||
        !airdropAmount ||
        _balance === undefined ||
        _balance === null ||
        _balance >= 4 ||
        !currentWallet ||
        !pgWalletPk ||
        // Only auto-airdrop to PgWallet
        !pgWalletPk.equals(currentWallet.publicKey)
      ) {
        return;
      }

      try {
        airdropping.current = true;
        const txHash = await conn.requestAirdrop(
          pgWalletPk,
          PgCommon.solToLamports(airdropAmount)
        );
        await PgTx.confirm(txHash, conn, "finalized");
      } catch (e: any) {
        console.log(e.message);
        setRateLimited(true);
      } finally {
        airdropping.current = false;
        _balance = PgCommon.lamportsToSol(await conn.getBalance(pgWalletPk));
        airdrop(_balance);
      }
    };

    airdrop();
  }, [balance, currentWallet, pgWalletPk, rateLimited, airdropAmount, conn]);

  return { balance };
};
