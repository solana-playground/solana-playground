import { BrowserRouter } from "react-router-dom";

import { SolanaProvider } from "./providers/solana";
import IDE from "./pages/ide";

const AppLazy = () => (
  <SolanaProvider>
    <BrowserRouter>
      <IDE />
    </BrowserRouter>
  </SolanaProvider>
);

export default AppLazy;
