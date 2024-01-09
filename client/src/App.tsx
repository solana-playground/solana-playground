import { lazy, Suspense } from "react";

import { ThemeProvider } from "./providers/theme";
import { AppLoading } from "./components/Loading/App";
import { PgSettings } from "./utils/pg/settings";
import { useDisposable } from "./hooks/useDisposable";

const AppLazy = lazy(() => import("./AppLazy"));

const App = () => {
  // Settings must be initialized before everything else
  useDisposable(PgSettings.init);

  return (
    <ThemeProvider>
      <Suspense fallback={<AppLoading />}>
        <AppLazy />
      </Suspense>
    </ThemeProvider>
  );
};

export default App;
