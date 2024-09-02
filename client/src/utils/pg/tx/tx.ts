import { ExplorerLink } from "./ExplorerLink";
import { PgCommon } from "../common";
import { PgPlaynet } from "../playnet";
import { PgSettings } from "../settings";
import { PgView } from "../view";
import { ConnectionOption, PgConnection } from "../connection";
import { CurrentWallet, PgWallet, WalletOption } from "../wallet";
import { PgWeb3 } from "../web3";

type WithTimeStamp<T> = T & {
  /** UNIX timestamp of the last cache */
  timestamp: number;
};

type BlockhashInfo = WithTimeStamp<{
  /** Latest blockhash */
  blockhash: string;
}>;

type PriorityFeeInfo = WithTimeStamp<{
  /** Average priority fee paid in the latest slots */
  average: number;
  /** Median priority fee paid in the latest slots */
  median: number;
  /** Minimum priority fee paid in the latest slots */
  min: number;
  /** Maximum priority fee paid in the latest slots */
  max: number;
}>;

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
    tx: PgWeb3.Transaction,
    opts?: {
      keypairSigners?: PgWeb3.Signer[];
      walletSigners?: CurrentWallet[];
      forceFetchLatestBlockhash?: boolean;
    } & ConnectionOption &
      WalletOption
  ): Promise<string> {
    const wallet = opts?.wallet ?? PgWallet.current;
    if (!wallet) throw new Error("Wallet not connected");

    const connection = opts?.connection ?? PgConnection.current;

    // Set priority fees if the transaction doesn't already have it
    const existingsetComputeUnitPriceIx = tx.instructions.find(
      (ix) =>
        ix.programId.equals(PgWeb3.ComputeBudgetProgram.programId) &&
        ix.data.at(0) === 3 // setComputeUnitPrice
    );
    if (!existingsetComputeUnitPriceIx) {
      const priorityFeeInfo = await this._getPriorityFee(connection);
      const priorityFeeSetting = PgSettings.connection.priorityFee;
      const priorityFee =
        typeof priorityFeeSetting === "number"
          ? priorityFeeSetting
          : priorityFeeInfo[priorityFeeSetting];
      if (priorityFee) {
        const setComputeUnitPriceIx =
          PgWeb3.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee,
          });
        tx.instructions = [setComputeUnitPriceIx, ...tx.instructions];
      }
    }

    tx.recentBlockhash = await this._getLatestBlockhash(
      connection,
      opts?.forceFetchLatestBlockhash
    );
    tx.feePayer = wallet.publicKey;

    // Add keypair signers
    if (opts?.keypairSigners?.length) tx.partialSign(...opts.keypairSigners);

    // Add wallet signers
    if (opts?.walletSigners) {
      for (const walletSigner of opts.walletSigners) {
        tx = await walletSigner.signTransaction(tx);
      }
    }

    // Sign with the current wallet as it's always the fee payer
    tx = await wallet.signTransaction(tx);

    // Caching the blockhash will result in getting the same tx signature when
    // using the same tx data.
    // https://github.com/solana-playground/solana-playground/issues/116
    let txHash;
    try {
      txHash = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: !PgSettings.connection.preflightChecks,
      });
    } catch (e: any) {
      if (
        e.message.includes("This transaction has already been processed") ||
        e.message.includes("Blockhash not found")
      ) {
        // Reset signatures
        tx.signatures = [];
        return await this.send(tx, {
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
    opts?: { commitment?: PgWeb3.Commitment } & ConnectionOption
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

  /** Cached priority fee to reduce the amount of requests to the RPC endpoint */
  private static _cachedPriorityFee: PriorityFeeInfo | null = null;

  /**
   * Get the latest blockhash from the cache or fetch the latest if the cached
   * blockhash has expired.
   *
   * @param conn `Connection` object to use
   * @param force whether to force fetch the latest blockhash
   *
   * @returns the latest blockhash
   */
  private static async _getLatestBlockhash(
    conn: PgWeb3.Connection,
    force?: boolean
  ) {
    // Check whether the latest saved blockhash is still valid
    const timestamp = PgCommon.getUnixTimstamp();

    // Blockhashes are valid for 150 slots, optimal block time is ~400ms
    // For finalized: (150 - 32) * 0.4 = 47.2s ~= 45s (to be safe)
    if (
      force ||
      !this._cachedBlockhashInfo ||
      timestamp > this._cachedBlockhashInfo.timestamp + 45
    ) {
      this._cachedBlockhashInfo = {
        blockhash: (await conn.getLatestBlockhash()).blockhash,
        timestamp,
      };
    }

    return this._cachedBlockhashInfo.blockhash;
  }

  /**
   * Get the priority fee information from the cache or fetch the latest if the
   * cache has expired.
   *
   * @param conn `Connection` object to use
   * @returns the priority fee information
   */
  private static async _getPriorityFee(conn: PgWeb3.Connection) {
    // Check whether the priority fee info has expired
    const timestamp = PgCommon.getUnixTimstamp();

    // There is not a perfect way to estimate for how long the priority fee will
    // be valid since it's a guess about the future based on the past data
    if (
      !this._cachedPriorityFee ||
      timestamp > this._cachedPriorityFee.timestamp + 60
    ) {
      const result = await conn.getRecentPrioritizationFees();
      const fees = result.map((fee) => fee.prioritizationFee).sort();

      this._cachedPriorityFee = {
        min: Math.min(...fees),
        max: Math.max(...fees),
        average: Math.ceil(fees.reduce((acc, cur) => acc + cur) / fees.length),
        median: fees[Math.floor(fees.length / 2)],
        timestamp,
      };
    }

    return this._cachedPriorityFee;
  }
}
