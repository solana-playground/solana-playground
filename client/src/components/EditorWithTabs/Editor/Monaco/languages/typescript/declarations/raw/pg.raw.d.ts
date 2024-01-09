declare module "solana-playground" {
  import * as web3 from "@solana/web3.js";

  interface DefaultWallet {
    /** Public key of the wallet */
    publicKey: web3.PublicKey;
    /** Sign the transaction with the wallet */
    signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(
      tx: T
    ): Promise<T>;
    /** Sign all transactions with the wallet */
    signAllTransactions<T extends web3.Transaction | web3.VersionedTransaction>(
      txs: T[]
    ): Promise<T[]>;
    /** Sign a message with the wallet */
    signMessage(message: Uint8Array): Promise<Uint8Array>;
  }

  interface PgWallet extends DefaultWallet {
    /** Keypair of the Playground Wallet */
    keypair: web3.Keypair;
  }

  /** Ready to be used connection object */
  const connection: web3.Connection;
}
