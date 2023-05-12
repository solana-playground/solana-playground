import * as ed25519 from "@noble/ed25519";
import { Keypair, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import { PgCommon } from "./common";
import { EventName } from "../../constants";
import type { PgSet } from "./types";

/** `localStorage` data for the playground wallet */
interface LsWallet {
  /** Whether the user accepted the initial setup pop-up */
  setupCompleted: boolean;
  /** Whether the wallet is in connected */
  connected: boolean;
  /**
   * ed25519 secret key(keypair).
   * First 32 bytes are the private key, last 32 bytes are the public key.
   *
   * NOTE: `Array` type is intentionally used as `Uint8Array` and `Buffer` are
   * causing problems while saving to localStorage.
   */
  sk: Array<number>;
}

/**
 * A wallet that can be used as a replacement for `AnchorWallet`.
 *
 * This implementation allows playground to not have to wait for user confirmation
 * for transactions.
 */
export class PgWallet {
  /**
   * Get the keypair of the wallet.
   *
   * NOTE: Direct use of this should be avoided when possible. This is made public
   * to give access for the users in code client.
   */
  static get keypair() {
    return this._kp;
  }

  /** Get keypair of the wallet as bytes */
  static get keypairBytes() {
    return Uint8Array.from(this.keypair.secretKey);
  }

  /**
   * Public key of the current wallet.
   *
   * NOTE: This will always be set, even when the wallet is not connected.
   */
  static get publicKey() {
    return this.keypair.publicKey;
  }

  /** Get whether the wallet is connected */
  static get isConnected() {
    return this._connected;
  }

  /** Get whether the user completed the wallet setup step */
  static get isSetupCompleted() {
    return this._setupCompleted;
  }

  /** Initialize the wallet from `localStorage` */
  static init() {
    const wallet = PgWallet._getLocalStorage();
    this._kp = Keypair.fromSecretKey(new Uint8Array(wallet.sk));
    this._connected = wallet.connected;
    this._setupCompleted = wallet.setupCompleted;
  }

  /**
   * Update the wallet both in `localStorage` and in state.
   *
   * This function will dispatch change events based on the update parameters.
   */
  static update(params: Partial<LsWallet>) {
    localStorage.setItem(
      this._WALLET_KEY,
      JSON.stringify({ ...this._getLocalStorage(), ...params })
    );

    // Initialize with the updated data
    this.init();

    PgCommon.createAndDispatchCustomEvent(EventName.WALLET_ON_DID_UPDATE, this);

    if (params.connected !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.WALLET_ON_DID_UPDATE_CONNECTION,
        this.isConnected
      );
    }
    if (params.sk !== undefined) {
      PgCommon.createAndDispatchCustomEvent(
        EventName.WALLET_ON_DID_UPDATE_KEYPAIR,
        this.keypair
      );
    }
  }

  /**
   * Sign the given transaction.
   *
   * @param tx transaction to sign
   * @returns the signed transaction
   *
   * NOTE: The API is async to make the types compatible with `AnchorWallet`
   */
  static async signTransaction(tx: Transaction) {
    tx.partialSign(this.keypair);
    return tx;
  }

  /**
   * Sign all transactions.
   *
   * @param txs transactions to sign
   * @returns the signed transactions
   *
   * NOTE: The API is async to make the types compatible with `AnchorWallet`
   */
  static async signAllTransactions(txs: Transaction[]) {
    for (const tx of txs) {
      tx.partialSign(this.keypair);
    }

    return txs;
  }

  /**
   * Sign an arbitrary message.
   *
   * @param message message to sign
   * @returns signature of the signed message
   */
  static async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return await ed25519.sign(message, this.keypair.secretKey.slice(0, 32));
  }

  /**
   * Set the wallet balance in the UI.
   *
   * @param balance setBalance type function
   */
  static setUIBalance(balance: PgSet<number | null>) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.WALLET_UI_BALANCE_SET,
      balance
    );
  }

  /**
   * @param cb callback function to run after wallet update
   * @returns a dispose function to clear the event
   */
  static onDidUpdate(cb: (wallet: typeof PgWallet) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.WALLET_ON_DID_UPDATE,
      initialValue: PgWallet,
    });
  }

  /**
   * @param cb callback function to run after wallet connect state change
   * @returns a dispose function to clear the event
   */
  static onDidUpdateConnection(cb: (connected: boolean) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.WALLET_ON_DID_UPDATE_CONNECTION,
      initialValue: PgWallet.isConnected,
    });
  }

  /**
   * @param cb callback function to run after wallet keypair change
   * @returns a dispose function to clear the event
   */
  static onDidUpdateKeypair(cb: (keypair: Keypair) => any) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.WALLET_ON_DID_UPDATE_CONNECTION,
      initialValue: PgWallet.keypair,
    });
  }

  /**
   * @param cb callback function to run after current wallet change
   * @returns a dispose function to clear the event
   */
  static onDidChangeCurrentWallet(
    cb: (wallet: typeof PgWallet | AnchorWallet) => any
  ) {
    return PgCommon.onDidChange({
      cb,
      eventName: EventName.WALLET_ON_DID_CHANGE_CURRENT_WALLET,
      initialValue: PgWallet,
    });
  }

  /** Keypair of the wallet */
  private static _kp: Keypair;

  /** Connected state of the wallet */
  private static _connected: boolean;

  /** Whether the user has completed the setup step */
  private static _setupCompleted: boolean;

  /** `localStorage` key for the wallet */
  private static readonly _WALLET_KEY = "wallet";

  /**
   * Get the wallet information from `localStorage`.
   *
   * This will create a random wallet if the wallet information doesn't exist.
   */
  private static _getLocalStorage() {
    const lsWalletStr = localStorage.getItem(this._WALLET_KEY);
    if (lsWalletStr) {
      return JSON.parse(lsWalletStr) as LsWallet;
    }

    const defaultWallet: LsWallet = {
      setupCompleted: false,
      connected: false,
      sk: Array.from(Keypair.generate().secretKey),
    };
    localStorage.setItem(this._WALLET_KEY, JSON.stringify(defaultWallet));
    return defaultWallet;
  }
}
