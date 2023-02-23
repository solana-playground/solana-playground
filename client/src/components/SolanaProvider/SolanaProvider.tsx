import { FC, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import * as buffer from "buffer";

import { EventName } from "../../constants";
import { connAtom } from "../../state";
import { PgConnection } from "../../utils/pg";
import { usePlaynet } from "./usePlaynet";

// Webpack 5 doesn't polyfill buffer
window.Buffer = buffer.Buffer;

/**
 * Connection and Wallet provider
 */
const SolanaProvider: FC = ({ children }) => {
  const [conn, setConn] = useAtom(connAtom);

  // Runs after connection config changes from the terminal
  useEffect(() => {
    const handleRefresh = () => {
      setConn(PgConnection.getConnectionConfig());
    };

    document.addEventListener(EventName.CONNECTION_REFRESH, handleRefresh);
    return () =>
      document.removeEventListener(EventName.CONNECTION_REFRESH, handleRefresh);
  }, [setConn]);

  const { customFetch } = usePlaynet();

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider
      endpoint={conn.endpoint}
      config={{
        commitment: conn.commitment,
        fetch: customFetch.fetch,
      }}
    >
      <WalletProvider wallets={wallets}>{children}</WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider;
