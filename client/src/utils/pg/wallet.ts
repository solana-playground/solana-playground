import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import * as ed25519 from "@noble/ed25519";

import { PgTerminal } from "./terminal/";
import { PgCommon } from "./common";
import { EventName } from "../../constants";

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

/**
 * A class that can be used as a replacement of any AnchorWallet.
 *
 * This implementation allows playground to not have to wait for user confirmation
 * for transactions.
 */
export class PgWallet implements AnchorWallet {
  private _kp: Keypair;

  /** Public key will always be set */
  publicKey: PublicKey;
  /** Connected can change */
  connected: boolean;

  constructor() {
    let lsWallet = PgWallet.getLs();
    if (!lsWallet) {
      lsWallet = DEFAULT_LS_WALLET;
      PgWallet.update(DEFAULT_LS_WALLET);
    }

    this._kp = Keypair.fromSecretKey(new Uint8Array(lsWallet.sk));
    this.publicKey = this._kp.publicKey;
    this.connected = lsWallet.connected;
  }

  get keypair() {
    return this._kp;
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

  /**
   * Sign arbitrary messages
   *
   * @param message message to sign
   * @returns signature of the signed message
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return await ed25519.sign(message, this.keypair.secretKey.slice(0, 32));
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

    PgTerminal.log(
      `${PgTerminal.bold(
        "Playground Wallet"
      )} must be connected to run this command. Run ${PgTerminal.bold(
        "connect"
      )} to connect.`
    );

    return false;
  }

  /**
   * Statically get the wallet object from state
   *
   * @returns the wallet object
   */
  static async get<T, R extends PgWallet>() {
    return await PgCommon.sendAndReceiveCustomEvent<T, R>(
      PgCommon.getStaticEventNames(EventName.WALLET_STATIC).get
    );
  }
}
