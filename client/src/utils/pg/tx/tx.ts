import { Commitment, Connection, Signer, Transaction } from "@solana/web3.js";

import { ExplorerLink } from "./ExplorerLink";
import { PgCommon } from "../common";
import { PgPlaynet } from "../playnet";
import { PgSettings } from "../settings";
import { PgView } from "../view";
import { ConnectionOption, PgConnection } from "../connection";
import { PgWallet, WalletOption } from "../wallet";

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
    opts?: {
      additionalSigners?: Signer[];
      forceFetchLatestBlockhash?: boolean;
    } & ConnectionOption &
      WalletOption
  ): Promise<string> {
    const wallet = opts?.wallet ?? PgWallet.current;
    if (!wallet) throw new Error("Wallet not connected");

    const connection = opts?.connection ?? PgConnection.current;

    tx.recentBlockhash = await this._getLatestBlockhash(
      connection,
      opts?.forceFetchLatestBlockhash
    );

    tx.feePayer = wallet.publicKey;

    if (opts?.additionalSigners?.length) {
      tx.partialSign(...opts.additionalSigners);
    }

    const signedTx = await wallet.signTransaction(tx);

    // Caching the blockhash will result in getting the same tx signature when
    // using the same tx data.
    // https://github.com/solana-playground/solana-playground/issues/116
    let txHash;
    try {
      txHash = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: !PgSettings.connection.preflightChecks,
      });
    } catch (e: any) {
      if (e.message.includes("This transaction has already been processed")) {
        // Reset signatures
        signedTx.signatures = [];
        return await this.send(signedTx, {
          ...opts,
          forceFetchLatestBlockhash: true,
        });
      }

      throw e;
    }

    return txHash;
  }

  /**
   * Confirm a transaction.
   *
   * @throws if rpc request fails
   * @returns an object with `err` property if the rpc request succeeded but tx failed
   */
  static async confirm(
    txHash: string,
    opts?: { commitment?: Commitment } & ConnectionOption
  ) {
    const connection = opts?.connection ?? PgConnection.current;

    // Don't confirm on playnet
    if (PgPlaynet.isUrlPlaynet(connection.rpcEndpoint)) return;

    const result = await connection.confirmTransaction(
      txHash,
      opts?.commitment
    );
    if (result?.value.err) return { err: result.value.err };
  }

  /**
   * Show a notification toast with explorer links for the transaction.
   *
   * @param txHash transaction signature
   */
  static notify(txHash: string) {
    // Check setting
    if (!PgSettings.notification.showTx) return;

    // Don't show on playnet
    if (PgPlaynet.isUrlPlaynet()) return;

    PgView.setToast(ExplorerLink, {
      componentProps: { txHash },
      options: { toastId: txHash },
    });
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
