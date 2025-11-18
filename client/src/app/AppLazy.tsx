import Delayed from "../components/Delayed";
import FadeIn from "../components/FadeIn";
import Effects from "./Effects";
import Panels from "./Panels";
import { GlobalsProvider } from "../providers/globals";
import { RouterProvider } from "../providers/router";
import { SolanaProvider } from "../providers/solana";

const AppLazy = () => (
  <GlobalsProvider>
    <RouterProvider>
      <SolanaProvider>
        <FadeIn>
          <Panels />
        </FadeIn>

        <Delayed delay={1000}>
          <Effects />
        </Delayed>
      </SolanaProvider>
    </RouterProvider>
  </GlobalsProvider>
);

export default AppLazy;
