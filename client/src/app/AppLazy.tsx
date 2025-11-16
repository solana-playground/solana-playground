import Delayed from "../components/Delayed";
import FadeIn from "../components/FadeIn";
import Effects from "./Effects";
import Globals from "./Globals";
import Panels from "./Panels";
import { RouterProvider } from "../providers/router";
import { SolanaProvider } from "../providers/solana";

const AppLazy = () => (
  <RouterProvider>
    <SolanaProvider>
      <Globals />

      <FadeIn>
        <Panels />
      </FadeIn>

      <Delayed delay={1000}>
        <Effects />
      </Delayed>
    </SolanaProvider>
  </RouterProvider>
);

export default AppLazy;
