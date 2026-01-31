import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  StandardWalletAdapter,
} from "@solana/wallet-adapter-base";

import type { PgWeb3 } from "../web3";

/** Wallet state */
export interface WalletState {
  /** Wallet connection state */
  state: "setup" | "disconnected" | "pg" | "sol";
  /** All accounts */
  accounts: WalletAccount[];
  /** Current wallet index */
  currentIndex: number;
  /** Whether to show the `Wallet` component */
  show: boolean;
  /** Wallet Standard wallets */
  standardWallets: StandardWallet[];
  /** Name of the standard wallet */
  standardName: string | null;
}

/** Playground wallet accounts (with keypair) */
export interface WalletAccount {
  /**
   * ed25519 keypair of the account.
   *
   * First 32 bytes are the private key, last 32 bytes are the public key.
   */
  kp: number[];
  /** Name of the account */
  name: string;
}

/** Serialized wallet that's used in storage */
export type SerializedWalletState = Pick<
  WalletState,
  "state" | "accounts" | "currentIndex" | "standardName"
>;

/** Legacy or versioned transaction */
export type AnyTransaction = PgWeb3.Transaction | PgWeb3.VersionedTransaction;

/**
 * The current wallet which can be a Playground Wallet or a Wallet Standard
 * Wallet.
 *
 * **NOTE:** If this is a Standard Wallet, it should always have its `publicKey`
 * field defined (non-nullable).
 */
export type Wallet = PgWallet | StandardWallet<true>;

/** Playground Wallet props */
type PgWallet = {
  /** The wallet is Playground Wallet */
  isPg: true;
  /** Keypair of the Playground Wallet account */
  keypair: PgWeb3.Keypair;
} & CommonWalletProps &
  NonNullablePublicKeyProp &
  SignerWalletProps;

/** All wallets other than Playground Wallet */
export type StandardWallet<C extends boolean = false> = {
  /** The wallet is not Playground Wallet */
  isPg?: false;
} & CommonWalletProps &
  (C extends true
    ? Omit<StandardWalletAdapter, "name" | "publicKey"> &
        NonNullablePublicKeyProp
    : Omit<StandardWalletAdapter, "name">) &
  SignerWalletProps;

/** Common props for both Playground Wallet and other wallets */
interface CommonWalletProps {
  /** Name of the account */
  name: string;
}

/** Non-nullable public key property (connected state) */
interface NonNullablePublicKeyProp {
  /** Name of the account */
  publicKey: PgWeb3.PublicKey;
}

/** Signer methods */
type SignerWalletProps = Pick<
  SignerWalletAdapterProps & MessageSignerWalletAdapterProps,
  "signMessage" | "signTransaction" | "signAllTransactions"
>;

/** Optional `wallet` prop */
export interface WalletOption {
  /** Wallet to use */
  wallet?: Wallet;
}
