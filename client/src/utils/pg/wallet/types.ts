import type {
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  WalletAdapterProps,
} from "@solana/wallet-adapter-base";

/** Wallet state */
export interface Wallet {
  /** All accounts */
  accounts: Array<{
    /**
     * ed25519 keypair of the account.
     *
     * First 32 bytes are the private key, last 32 bytes are the public key.
     */
    kp: Array<number>;
    /** Name of the account, `null` by default */
    name: WalletAccountName;
  }>;
  /** Whether the user accepted the initial setup pop-up */
  isSetupCompleted: boolean;
  /** Whether the wallet is connected */
  isConnected: boolean;
  /** Current wallet index */
  currentIndex: number;
  /** Balance of the current wallet, `null` by default */
  balance: number | null;
  /** Whether to show the `Wallet` component */
  show: boolean;
}

/** Serialized wallet that's used in storage */
export interface SerializedWallet {
  isSetupCompleted: boolean;
  accounts: Array<{
    kp: Array<number>;
    name: WalletAccountName;
  }>;
  currentIndex: number;
  isConnected: boolean;
}

/** Custom name of the wallet or `null` */
export type WalletAccountName = string | null;

/** Legacy or versioned transaction */
export type AnyTransaction = Transaction | VersionedTransaction;

/**
 * The current wallet which can be a Playground Wallet, a Wallet Standard Wallet
 * or `null` if disconnected.
 */
export type CurrentWallet = (PgWalletProps | OtherWalletProps) | null;

/** Playground Wallet props */
export interface PgWalletProps extends DefaultWalletProps {
  /** The wallet is Playground Wallet */
  isPg: true;
  /** Keypair of the Playground Wallet */
  keypair: Keypair;
  /** Custom name of the Playground Wallet */
  name: WalletAccountName;
}

/** All wallets other than Playground Wallet */
export interface OtherWalletProps extends DefaultWalletProps {
  /** The wallet is not Playground Wallet */
  isPg: false;
}

/** Common props for both Playground Wallet and other wallets */
type DefaultWalletProps<PublicKeyProp = Pick<WalletAdapterProps, "publicKey">> =
  Pick<
    SignerWalletAdapterProps & MessageSignerWalletAdapterProps,
    "signMessage" | "signTransaction" | "signAllTransactions"
  > & {
    [K in keyof PublicKeyProp]: NonNullable<PublicKeyProp[K]>;
  };

/** Optional `wallet` prop */
export type WalletOption = {
  /** Wallet to use */
  wallet?: NonNullable<CurrentWallet>;
};
