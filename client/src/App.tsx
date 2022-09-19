import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAtom } from "jotai";
import { ConnectionConfig } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import MutThemeProvider from "./theme/";
import IDE from "./pages/ide";
import { connAtom } from "./state";
import { PgConnection } from "./utils/pg";
import { EventName } from "./constants";

const App = () => {
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

  const endpoint = conn.endpoint;
  const config: ConnectionConfig = {
    commitment: conn.commitment,
  };

  const wallets = [new PhantomWalletAdapter()];

  return (
    <MutThemeProvider>
      <ConnectionProvider endpoint={endpoint} config={config}>
        <WalletProvider wallets={wallets}>
          <BrowserRouter>
            <IDE />
          </BrowserRouter>
        </WalletProvider>
      </ConnectionProvider>
    </MutThemeProvider>
  );
};

export default App;
