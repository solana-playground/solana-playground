import { FC, useEffect, useMemo } from "react";
import {
  StandardWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import {
  useWallet as useSolanaWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { PgWallet } from "../../utils";
import { useWallet } from "../../hooks";

export const SolanaProvider: FC = ({ children }) => {
  const wallets = useMemo(() => [], []);

  return (
    <WalletProvider wallets={wallets}>
      <PgWalletProvider>{children}</PgWalletProvider>
    </WalletProvider>
  );
};

const PgWalletProvider: FC = ({ children }) => {
  const wallet = useWallet();
  const { wallets } = useSolanaWallet();

  // Set the standard wallets
  useEffect(() => {
    // Only check for the `standard` field because signer methods such as
    // `signTransaction` and `signMessage` are optional, and they are only
    // getting set after a successful connection.
    PgWallet.standardWallets = wallets
      .filter((w) => w.readyState === WalletReadyState.Installed)
      .map((w) => w.adapter)
      .filter(
        (w) => (w as StandardWalletAdapter).standard
      ) as StandardWalletAdapter[];
  }, [wallets]);

  // Re-derive the `standard` and `current` fields when the user changes
  // standard wallet accounts (inside the extension)
  useEffect(() => {
    if (!wallet || wallet.isPg) return;

    const handleStandardAccountChange = () => {
      // Set the `standardWallets` to itself to trigger the re-derivation of the
      // derivable fields that depend on this field (`standard` and `current`).
      //
      // NOTE: This only works because the field `standardWallets` is an object,
      // which is not cached by the decorator implementation. Using `standardName`
      // instead would not trigger re-derivation after the first change because
      // string values are cached.
      PgWallet.update({ standardWallets: PgWallet.standardWallets });
    };

    // There is no specific event for account changes, but the `connect` event
    // triggers after account switch even if the wallet is already connected
    wallet.on("connect", handleStandardAccountChange);

    return () => {
      wallet.off("connect", handleStandardAccountChange);
    };
  }, [wallet]);

  return <>{children}</>;
};
