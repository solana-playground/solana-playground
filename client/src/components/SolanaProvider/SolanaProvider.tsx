import { FC, useMemo } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { PgSettings } from "../../utils/pg";
import { usePlaynet } from "./usePlaynet";

/**
 * Connection and Wallet provider
 */
const SolanaProvider: FC = ({ children }) => {
  const { customFetch } = usePlaynet();

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider
      endpoint={PgSettings.connection.endpoint}
      config={{
        commitment: PgSettings.connection.commitment,
        fetch: customFetch.fetch,
      }}
    >
      <WalletProvider wallets={wallets}>{children}</WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider;
