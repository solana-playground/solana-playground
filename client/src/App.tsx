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

const App = () => {
  const [conn] = useAtom(connAtom);

  const endpoint = conn.endpoint ?? PgConnection.DEFAULT_CONNECTION.endpoint!;
  const config: ConnectionConfig = {
    commitment: conn.commitment ?? PgConnection.DEFAULT_CONNECTION.commitment,
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
