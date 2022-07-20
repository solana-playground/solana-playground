import { Connection, Signer, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgWallet } from "./wallet";

export class PgTx {
  /**
   * Send a transaction with additional signer optionality
   * @returns transaction signature
   */
  static async send(
    tx: Transaction,
    conn: Connection,
    wallet: PgWallet | AnchorWallet,
    additionalSigners?: Signer[]
  ) {
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

    tx.feePayer = wallet.publicKey;

    if (additionalSigners?.length) {
      tx.partialSign(...additionalSigners);
    }

    await wallet.signTransaction(tx);

    const rawTx = tx.serialize();

    return await conn.sendRawTransaction(rawTx);
  }

  /**
   * Confirm a transaction
   *
   * Throws an error if rpc request fails
   * @returns an object with `err` property if the rpc request succeeded but tx failed
   */
  static async confirm(txHash: string, conn: Connection) {
    const result = await conn.confirmTransaction(txHash);
    if (result?.value.err) return { err: 1 };
  }
}
