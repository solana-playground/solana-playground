import { lazy, Suspense } from "react";

import MutThemeProvider from "./theme";
import { AppLoading } from "./components/Loading/App";
import { PgSettings } from "./utils/pg/settings";
import { useDisposable } from "./hooks/useDisposable";

const AppLazy = lazy(() => import("./AppLazy"));

const App = () => {
  // Settings must be initialized before everything else
  useDisposable(PgSettings.init);

  return (
    <MutThemeProvider>
      <Suspense fallback={<AppLoading />}>
        <AppLazy />
      </Suspense>
    </MutThemeProvider>
  );
};

export default App;
