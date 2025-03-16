import { BrowserRouter } from "react-router-dom";

import Delayed from "../components/Delayed";
import FadeIn from "../components/FadeIn";
import Helpers from "./Helpers";
import Global from "./Global";
import Panels from "./Panels";
import { SolanaProvider } from "../providers/solana";

const AppLazy = () => (
  <SolanaProvider>
    <BrowserRouter>
      <FadeIn>
        <Panels />
        <Global />
        <Delayed delay={1000}>
          <Helpers />
        </Delayed>
      </FadeIn>
    </BrowserRouter>
  </SolanaProvider>
);

export default AppLazy;
