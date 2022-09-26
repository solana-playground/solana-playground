declare module "solana-playground" {
  import * as web3 from "@solana/web3.js";

  interface PgWallet {
    publicKey: web3.PublicKey;
    signTransaction: (tx: web3.Transaction) => Promise<web3.Transaction>;
    signAllTransactions: (
      txs: web3.Transaction[]
    ) => Promise<web3.Transaction[]>;
  }

  /** Same connection that's being used in playground */
  const connection: web3.Connection;

  /** Playground wallet */
  // _wallet_

  /** Your program public key from playground */
  // _programId_

  /** Your Anchor program */
  // _program_

  global {
    /**
     * @param ms amount of time to sleep in ms
     * @returns a promise that will resolve after specified ms
     */
    function sleep(ms?: number): Promise<void>;
  }
}
