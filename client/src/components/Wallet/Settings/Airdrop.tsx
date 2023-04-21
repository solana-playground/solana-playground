import { useCallback } from "react";
import { useAtom } from "jotai";
import { PublicKey } from "@solana/web3.js";

import { txHashAtom } from "../../../state";
import { Emoji } from "../../../constants";
import { PgCommon, PgConnection, PgTerminal, PgTx } from "../../../utils/pg";
import { useAirdropAmount, useCurrentWallet } from "../../../hooks";

export const useAirdrop = () => {
  const [, setTxHash] = useAtom(txHashAtom);

  // Get cap amount for airdrop based on network
  const amount = useAirdropAmount();
  const { pgWalletPk, solWalletPk } = useCurrentWallet();

  const airdrop = useCallback(
    async (walletPk: PublicKey) => {
      await PgTerminal.process(async () => {
        if (!amount) return;

        let msg;
        try {
          PgTerminal.log(PgTerminal.info("Sending an airdrop request..."));

          const conn = await PgConnection.get();

          // Airdrop tx is sometimes successful even when balance hasn't changed
          // Instead of confirming the tx, we will check before and after balance
          const beforeBalance = await conn.getBalance(walletPk, "processed");

          const txHash = await conn.requestAirdrop(
            walletPk,
            PgCommon.solToLamports(amount)
          );
          setTxHash(txHash);

          // Allow enough time for balance to update by waiting for confirmation
          await PgTx.confirm(txHash, conn);

          const afterBalance = await conn.getBalance(walletPk, "processed");

          if (afterBalance > beforeBalance)
            msg = `${Emoji.CHECKMARK} ${PgTerminal.success(
              "Success."
            )} Received ${PgTerminal.bold(amount.toString())} SOL.`;
          else
            msg = `${Emoji.CROSS} ${PgTerminal.error(
              "Error receiving airdrop."
            )}`;
        } catch (e: any) {
          const convertedError = PgTerminal.convertErrorMessage(e.message);

          msg = `${Emoji.CROSS} ${PgTerminal.error(
            "Error receiving airdrop:"
          )}: ${convertedError}`;
        } finally {
          PgTerminal.log(msg + "\n");
        }
      });
    },
    [amount, setTxHash]
  );

  const airdropPg = useCallback(async () => {
    if (pgWalletPk) await airdrop(pgWalletPk);
  }, [pgWalletPk, airdrop]);

  const airdropSol = useCallback(async () => {
    if (solWalletPk) await airdrop(solWalletPk);
  }, [solWalletPk, airdrop]);

  return {
    pgCond: pgWalletPk && !!amount,
    solCond: (solWalletPk && !!amount) ?? false,
    airdropPg: airdropPg,
    airdropSol: airdropSol,
  };
};
