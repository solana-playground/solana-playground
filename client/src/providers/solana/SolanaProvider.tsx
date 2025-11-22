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
    PgWallet.standardWallets = wallets;
  }, [wallets, publicKey]);

  return <>{children}</>;
};
