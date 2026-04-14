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
    // To solve this, we also check before and after balance instead of only
    // confirming the tx.
    const beforeBalance = await connection.getBalance(walletPk, "processed");

    // Send the airdrop request
    const txHash = await connection.requestAirdrop(
      walletPk,
      PgWeb3.solToLamports(amount)
    );

    // Allow enough time for balance to update by waiting for confirmation
    const txResult = await PgTx.confirm(txHash, connection);
    if (txResult?.err) {
      throw new Error(`Airdrop transaction failed: ${txResult.err}`);
    }

    const afterBalance = await connection.getBalance(walletPk, "processed");
    if (afterBalance === beforeBalance) {
      throw new Error("Balance did not change");
    }

    PgTerminal.println(PgTerminal.success("Airdrop successful."));
  },
});
