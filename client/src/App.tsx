import { lazy, Suspense } from "react";

import MutThemeProvider from "./theme";
import { AppLoading } from "./components/Loading/App";

const AppLazy = lazy(() => import("./AppLazy"));

const App = () => (
  <MutThemeProvider>
    <Suspense fallback={<AppLoading />}>
      <AppLazy />
    </Suspense>
  </MutThemeProvider>
);

export default App;
