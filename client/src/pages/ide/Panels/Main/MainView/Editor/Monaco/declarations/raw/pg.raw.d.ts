declare module "solana-playground" {
  import * as web3 from "@solana/web3.js";

  interface PgWallet {
    publicKey: web3.PublicKey;
    keypair: web3.Keypair;
    signTransaction: (tx: web3.Transaction) => Promise<web3.Transaction>;
    signAllTransactions: (
      txs: web3.Transaction[]
    ) => Promise<web3.Transaction[]>;
  }

  /** Ready to be used connection object */
  const connection: web3.Connection;
}
