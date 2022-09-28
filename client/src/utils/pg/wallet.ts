import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { PgTerminal } from "./terminal/";

interface LsWallet {
  setupCompleted: boolean;
  connected: boolean;
  // Uint8Array and Buffer is causing problems while saving to ls
  sk: Array<number>;
}

const DEFAULT_LS_WALLET: LsWallet = {
  setupCompleted: false,
  connected: false,
  sk: Array.from(Keypair.generate().secretKey),
};

export class PgWallet {
  keypair: Keypair;
  // Public key will always be set
  publicKey: PublicKey;
  // Connected can change
  connected: boolean;

  constructor() {
    let lsWallet = PgWallet.getLs();
    if (!lsWallet) {
      lsWallet = DEFAULT_LS_WALLET;
      PgWallet.update(DEFAULT_LS_WALLET);
    }

    this.keypair = Keypair.fromSecretKey(new Uint8Array(lsWallet.sk));
    this.publicKey = this.keypair.publicKey;
    this.connected = lsWallet.connected;
  }

  // For compatibility with AnchorWallet
  async signTransaction(tx: Transaction) {
    tx.partialSign(this.keypair);
    return tx;
  }

  // For compatibility with AnchorWallet
  async signAllTransactions(txs: Transaction[]) {
    for (const tx of txs) {
      tx.partialSign(this.keypair);
    }

    return txs;
  }

  // Statics
  private static readonly _WALLET_KEY = "wallet";

  static get keypairBytes() {
    return Uint8Array.from(this.getKp().secretKey);
  }

  /**
   * @returns wallet info from localStorage
   */
  static getLs() {
    const lsWalletStr = localStorage.getItem(this._WALLET_KEY);
    if (!lsWalletStr) return null;

    const lsWallet: LsWallet = JSON.parse(lsWalletStr);
    return lsWallet;
  }

  /**
   * Update localStorage wallet
   */
  static update(updateParams: Partial<LsWallet>) {
    const lsWallet = this.getLs() ?? DEFAULT_LS_WALLET;

    if (updateParams.setupCompleted !== undefined)
      lsWallet.setupCompleted = updateParams.setupCompleted;
    if (updateParams.connected !== undefined)
      lsWallet.connected = updateParams.connected;
    if (updateParams.sk) lsWallet.sk = updateParams.sk;

    localStorage.setItem(this._WALLET_KEY, JSON.stringify(lsWallet));
  }

  /**
   * @returns wallet keypair from localStorage
   */
  static getKp() {
    return Keypair.fromSecretKey(new Uint8Array(this.getLs()!.sk));
  }

  /**
   * Checks if pg wallet is connected and
   * logs instructions in terminal if wallet is not connected
   * @returns pg wallet connection status
   */
  static checkIsPgConnected() {
    if (this.getLs()?.connected) return true;

    PgTerminal.logWasm(
      `${PgTerminal.bold(
        "Playground Wallet"
      )} must be connected to run this command. Run ${PgTerminal.bold(
        "connect"
      )} to connect.`
    );
    PgTerminal.enable();

    return false;
  }
}
