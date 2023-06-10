import { FC, useEffect, useMemo } from "react";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { PgWallet } from "../../utils/pg";

const SolanaProvider: FC = ({ children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <WalletProvider wallets={wallets}>
      <PlaygroundWalletProvider>{children}</PlaygroundWalletProvider>
    </WalletProvider>
  );
};

const PlaygroundWalletProvider: FC = ({ children }) => {
  const { wallet, publicKey } = useWallet();

  // Handle the connection of Solana wallets to Playground Wallet
  useEffect(() => {
    // Add timeout because `PgWallet` listeners are not available on mount
    const id = setTimeout(() => {
      PgWallet.update({ otherWallet: wallet?.adapter ?? null });
    });
    return () => clearTimeout(id);
  }, [wallet, publicKey]);

  return <>{children}</>;
};

export default SolanaProvider;
