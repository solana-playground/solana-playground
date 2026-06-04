import {
  PgCommon,
  PgConnection,
  PgTerminal,
  PgTx,
  PgWallet,
  PgWeb3,
} from "../../utils";
import { checkWallet } from "../checks";
import { createArgs, createCmd } from "../create";

export const airdrop = createCmd({
  name: "airdrop",
  description: "Airdrop SOL",
  args: createArgs([
    // TODO: Add `default` value
    {
      name: "amount",
      description: "Airdrop amount (in SOL)",
      optional: true,
      parse: (token) => {
        if (PgCommon.isFloat(token)) return parseFloat(token);
        throw new Error("Amount must be a number");
      },
    },
  ]),
  preCheck: checkWallet,
  handle: async (input) => {
    const defaultAmount = PgConnection.getAirdropAmount();
    if (typeof defaultAmount !== "number") {
      throw new Error("Cannot airdrop on this cluster");
    }

    const amount = input.args.amount ?? defaultAmount;
    PgTerminal.println(PgTerminal.info(`Airdropping ${amount} SOL...`));

    const connection = PgConnection.current;
    const walletPk = PgWallet.current!.publicKey;

    // Airdrop tx is sometimes successful even when the balance hasn't changed.
    // Check check before and after balance instead of only confirming the tx
    // to mitigate.
    const beforeBalance = await connection.getBalance(walletPk, "processed");

    // Request an airdrop from the RPC.
    //
    // The `requestAirdrop` method sometimes returns the same tx hash for
    // multiple requests, even after considerable amount of time has passed.
    // Retry until it returns a different hash to mitigate.
    while (1) {
      const txHash = await connection.requestAirdrop(
        walletPk,
        PgWeb3.solToLamports(amount)
      );
      if (txHash !== cachedTxHash) {
        cachedTxHash = txHash;
        break;
      }

      await PgCommon.sleep(5000);
    }

    // Allow enough time for balance to update by waiting for confirmation
    const txResult = await PgTx.confirm(cachedTxHash);
    if (txResult?.err) {
      throw new Error(`Airdrop transaction failed: ${txResult.err}`);
    }

    // Even though we waited for the transaction to confirm, `getBalance` can
    // sometimes return a stale balance. Try a couple times to mitigate.
    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const afterBalance = await connection.getBalance(walletPk, "processed");
      if (afterBalance !== beforeBalance) break;
      if (i === MAX_RETRIES - 1) throw new Error("Balance did not change");

      const confirmations = connection.commitment === "finalized" ? 32 : 1;
      await PgCommon.sleep(confirmations * PgWeb3.DEFAULT_MS_PER_SLOT);
    }

    PgTerminal.println(PgTerminal.success("Airdrop successful."));
  },
});

let cachedTxHash: string;
