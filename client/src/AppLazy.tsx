import { BrowserRouter } from "react-router-dom";

import SolanaProvider from "./components/SolanaProvider";
import IDE from "./pages/ide";

const AppLazy = () => (
  <SolanaProvider>
    <BrowserRouter>
      <IDE />
    </BrowserRouter>
  </SolanaProvider>
);

export default AppLazy;
