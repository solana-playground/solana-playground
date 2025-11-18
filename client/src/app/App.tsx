import { lazy, Suspense } from "react";

import { ThemeProvider } from "../providers/theme";
import { AppLoading } from "../components/Loading/App";

// If we initialize globals here e.g.
//
// ```
// const AppLazy = lazy(async () => {
//   const { GLOBALS } = await import("../globals");
//   const { initAll } = await import("../utils/pg");
//   await initAll(GLOBALS);
//
//   return import("./AppLazy");
// });
// ```
//
// It results in significantly more chunks to load before the suspense is over.
// For this reason, globals are getting initialized inside `AppLazy`, which
// allows us to have as little chunks as possible.
const AppLazy = lazy(() => import("./AppLazy"));

const App = () => (
  <ThemeProvider>
    <Suspense fallback={<AppLoading />}>
      <AppLazy />
    </Suspense>
  </ThemeProvider>
);

export default App;
