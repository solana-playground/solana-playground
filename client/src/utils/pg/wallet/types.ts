import type {
  Adapter,
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  WalletAdapter,
  WalletAdapterProps,
} from "@solana/wallet-adapter-base";
import type { Wallet as SolanaWallet } from "@solana/wallet-adapter-react";

import type { PgWeb3 } from "../web3";

/** Wallet state */
export interface Wallet {
  /** Wallet connection state */
  state: "setup" | "disconnected" | "pg" | "sol";
  /** All accounts */
  accounts: WalletAccount[];
  /** Current wallet index */
  currentIndex: number;
  /** Balance of the current wallet, `null` by default */
  balance: number | null;
  /** Whether to show the `Wallet` component */
  show: boolean;
  /** Wallet Standard wallets */
  standardWallets: SolanaWallet[];
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
export type SerializedWallet = Pick<
  Wallet,
  "state" | "accounts" | "currentIndex" | "standardName"
>;

/** Legacy or versioned transaction */
export type AnyTransaction = PgWeb3.Transaction | PgWeb3.VersionedTransaction;

/**
 * The current wallet which can be a Playground Wallet, a Wallet Standard Wallet
 * or `null` if disconnected.
 */
export type CurrentWallet = PgWalletProps | StandardWalletProps;

/** Wallet Standard wallet */
export type StandardWallet = StandardWalletProps | Adapter;

/** Playground Wallet props */
interface PgWalletProps extends DefaultWalletProps {
  /** The wallet is Playground Wallet */
  isPg: true;
  /** Keypair of the Playground Wallet account */
  keypair: PgWeb3.Keypair;
}

/** All wallets other than Playground Wallet */
export interface StandardWalletProps
  extends DefaultWalletProps,
    DefaultAdapter {
  /** The wallet is not Playground Wallet */
  isPg: false;
}

/** Wallet adapter without `publicKey` prop */
type DefaultAdapter = Omit<WalletAdapter, "publicKey" | "name">;

/** Common props for both Playground Wallet and other wallets */
type DefaultWalletProps<PublicKeyProp = Pick<WalletAdapterProps, "publicKey">> =
  Pick<
    SignerWalletAdapterProps & MessageSignerWalletAdapterProps,
    "signMessage" | "signTransaction" | "signAllTransactions"
  > & {
    [K in keyof PublicKeyProp]: NonNullable<PublicKeyProp[K]>;
  } & {
    /** Name of the account */
    name: string;
  };

/** Optional `wallet` prop */
export interface WalletOption {
  /** Wallet to use */
  wallet?: CurrentWallet;
}
