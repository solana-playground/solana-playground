import { FC, useEffect, useMemo } from "react";
import {
  StandardWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";

import { PgWallet } from "../../utils";

export const SolanaProvider: FC = ({ children }) => {
  const wallets = useMemo(() => [], []);

  return (
    <WalletProvider wallets={wallets}>
      <PgWalletProvider>{children}</PgWalletProvider>
    </WalletProvider>
  );
};

const PgWalletProvider: FC = ({ children }) => {
  const { wallets } = useWallet();

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

  return <>{children}</>;
};
