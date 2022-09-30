import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { balanceAtom } from "../../../state";
import { PgCommon } from "../../../utils/pg";
import { useAirdropAmount, useCurrentWallet } from "../Wallet";

export const useAutoAirdrop = () => {
  const [balance, setBalance] = useAtom(balanceAtom);

  const { connection: conn } = useConnection();
  const { currentWallet, pgWalletPk } = useCurrentWallet();

  useEffect(() => {
    if (!currentWallet) return;

    const fetchBalance = async () => {
      const lamports = await conn.getBalance(currentWallet.publicKey);

      setBalance(PgCommon.lamportsToSol(lamports));
    };
    fetchBalance().catch(() => setBalance(null));

    // Listen for balance changes
    const id = conn.onAccountChange(currentWallet.publicKey, (a) =>
      setBalance(PgCommon.lamportsToSol(a.lamports))
    );

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
      )
        return;

      try {
        airdropping.current = true;
        const txHash = await conn.requestAirdrop(
          pgWalletPk,
          PgCommon.solToLamports(airdropAmount)
        );
        await conn.confirmTransaction(txHash, "finalized");
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
