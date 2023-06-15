import { FC, useEffect, useMemo } from "react";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";

import { PgWallet } from "../../utils/pg";

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

  // Handle the connection of Solana wallets to Playground Wallet
  useEffect(() => {
    // Add timeout because `PgWallet` listeners are not available on mount
    const id = setTimeout(() => {
      PgWallet.standardWallets = wallets;
    });
    return () => clearTimeout(id);
  }, [wallets, publicKey]);

  return <>{children}</>;
};
