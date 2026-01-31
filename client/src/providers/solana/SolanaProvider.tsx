import { FC, useEffect, useMemo } from "react";
import {
  MessageSignerWalletAdapter,
  SignerWalletAdapter,
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
  const { wallets, publicKey } = useWallet();

  // Set the standard wallets
  useEffect(() => {
    // @ts-ignore
    PgWallet.standardWallets = wallets
      .filter((w) => w.readyState === WalletReadyState.Installed)
      .map((w) => w.adapter)
      .filter((w) => (w as StandardWalletAdapter).standard)
      .filter((w) => (w as SignerWalletAdapter).signTransaction)
      .filter((w) => (w as MessageSignerWalletAdapter).signMessage);
  }, [wallets, publicKey]);

  return <>{children}</>;
};
