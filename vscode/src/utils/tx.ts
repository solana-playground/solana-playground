import { Connection, Keypair, Signer, Transaction } from "@solana/web3.js";

import { PgConnection } from "./connection";

export class PgTx {
  /**
   * Send a transaction with additional signer optionality
   * @returns transaction signature
   */
  static async send(
    tx: Transaction,
    conn: Connection,
    walletKp: Keypair,
    additionalSigners?: Signer[]
  ) {
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.feePayer = walletKp.publicKey;

    if (additionalSigners?.length) {
      tx.partialSign(...additionalSigners);
    }
    tx.partialSign(walletKp);

    return await conn.sendRawTransaction(tx.serialize(), {
      skipPreflight: !PgConnection.preflightChecks,
    });
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
