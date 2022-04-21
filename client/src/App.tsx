import { useAtom } from "jotai";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import MutThemeProvider from "./theme/";
import IDE from "./pages/ide";
import { endpointAtom } from "./state";

const App = () => {
  const [endpoint] = useAtom(endpointAtom);

  const wallets = [new PhantomWalletAdapter()];

  return (
    <MutThemeProvider>
      <ConnectionProvider
        endpoint={endpoint}
        config={{ commitment: "confirmed" }}
      >
        <WalletProvider wallets={wallets}>
          <IDE />
        </WalletProvider>
      </ConnectionProvider>
    </MutThemeProvider>
  );
};

export default App;
