import { FC, useMemo } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

const SolanaProvider: FC = ({ children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return <WalletProvider wallets={wallets}>{children}</WalletProvider>;
};

export default SolanaProvider;
