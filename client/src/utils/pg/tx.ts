import { Commitment, Connection, Signer, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgCommon } from "./common";
import { PgConnection } from "./connection";
import { PgPlaynet } from "./playnet";
import { PgWallet } from "./wallet";

interface BlockhashInfo {
  /** Latest blockhash */
  blockhash: string;
  /** UNIX timestamp of when the blockhash was last cached */
  timestamp: number;
}

export class PgTx {
  /**
   * Send a transaction with additional signer optionality.
   *
   * This method caches the latest blockhash in order to minimize the amount of
   * RPC requests.
   *
   * @returns the transaction signature
   */
  static async send(
    tx: Transaction,
    conn: Connection,
    wallet: PgWallet | AnchorWallet,
    additionalSigners?: Signer[],
    forceFetchLatestBlockhash?: boolean
  ): Promise<string> {
    tx.recentBlockhash = await this._getLatestBlockhash(
      conn,
      forceFetchLatestBlockhash
    );

    tx.feePayer = wallet.publicKey;

    if (additionalSigners?.length) {
      tx.partialSign(...additionalSigners);
    }

    await wallet.signTransaction(tx);

    // Caching the blockhash will result in getting the same tx signature when
    // using the same tx data.
    // https://github.com/solana-playground/solana-playground/issues/116
    let txHash;
    try {
      txHash = await conn.sendRawTransaction(tx.serialize(), {
        skipPreflight: !PgConnection.preflightChecks,
      });
    } catch (e: any) {
      if (e.message.includes("This transaction has already been processed")) {
        // Reset signatures
        tx.signatures = [];
        return await this.send(tx, conn, wallet, additionalSigners, true);
      }

      throw e;
    }

    return txHash;
  }

  /**
   * Confirm a transaction
   *
   * @throws if rpc request fails
   * @returns an object with `err` property if the rpc request succeeded but tx failed
   */
  static async confirm(
    txHash: string,
    conn: Connection,
    commitment?: Commitment
  ) {
    // Don't confirm on playnet
    if (PgPlaynet.isUrlPlaynet(conn.rpcEndpoint)) {
      return;
    }

    const result = await conn.confirmTransaction(txHash, commitment);
    if (result?.value.err) return { err: result.value.err };
  }

  /** Cached blockhash to reduce the amount of requests to the RPC endpoint */
  private static _cachedBlockhashInfo: BlockhashInfo | null = null;

  /**
   * Get the latest blockhash from the cache or fetch the latest if the cached
   * blockhash has expired
   *
   * @param conn Connection object to use
   * @param force whether to force fetch the latest blockhash
   *
   * @returns the latest blockhash
   */
  private static async _getLatestBlockhash(conn: Connection, force?: boolean) {
    // Check whether the latest saved blockhash is still valid
    const currentTs = PgCommon.getUnixTimstamp();

    // Blockhashes are valid for 150 slots, optimal block time is ~400ms
    // For finalized: (150 - 32) * 0.4 = 47.2s ~= 45s (to be safe)
    if (
      force ||
      !this._cachedBlockhashInfo ||
      currentTs > this._cachedBlockhashInfo.timestamp + 45
    ) {
      this._cachedBlockhashInfo = {
        blockhash: (await conn.getLatestBlockhash()).blockhash,
        timestamp: currentTs,
      };
    }

    return this._cachedBlockhashInfo.blockhash;
  }
}
