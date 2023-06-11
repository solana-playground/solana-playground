import * as ed25519 from "@noble/ed25519";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

import type { AnyTransaction, CurrentWallet, Wallet } from "./types";

/**
 * Create a Playground Wallet instance from the given account.
 *
 * @param account wallet account to derive the instance from
 * @returns a Playground Wallet instance
 */
export const createPgWalletInstance = (
  account: Wallet["accounts"][number]
): CurrentWallet => {
  const keypair = Keypair.fromSecretKey(Uint8Array.from(account.kp));

  return {
    isPg: true,
    keypair,
    publicKey: keypair.publicKey,

    async signTransaction<T extends AnyTransaction>(tx: T) {
      if ((tx as VersionedTransaction).version) {
        (tx as VersionedTransaction).sign([keypair]);
      } else {
        (tx as Transaction).partialSign(keypair);
      }

      return tx;
    },

    async signAllTransactions<T extends AnyTransaction>(txs: T[]) {
      for (const tx of txs) {
        this.signTransaction(tx);
      }

      return txs;
    },

    async signMessage(message: Uint8Array) {
      return await ed25519.sign(message, keypair.secretKey.slice(0, 32));
    },
  };
};
