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
      <FadeIn>
        <Panels />
      </FadeIn>

      {/* A lot of unrelated functionality expects `Global` to be mounted
      *after* `Panels`, thus changing the order may result in unexpected behavior.

      TODO: Mount `Global` before `Panels` after making sure everything works as
      expected. This will likely either require `PgView` methods async and retry
      as needed, or make the class `updatable` to store its state internally
      rather than communicating with components via events to get their state.

      It might even be worth to show loading screen until all globals are
      initialized. This would allow us to get rid of seemingly redundant checks
      such as checking whether the explorer has been initialized.
      */}
      <Globals />

      <Delayed delay={1000}>
        <Effects />
      </Delayed>
    </SolanaProvider>
  </RouterProvider>
);

export default AppLazy;
