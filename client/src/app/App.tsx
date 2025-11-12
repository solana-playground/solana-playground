import { lazy, Suspense } from "react";

import { ThemeProvider } from "../providers/theme";
import { AppLoading } from "../components/Loading/App";

const AppLazy = lazy(() => import("./AppLazy"));

const App = () => (
  <ThemeProvider>
    <Suspense fallback={<AppLoading />}>
      <AppLazy />
    </Suspense>
  </ThemeProvider>
);

export default App;
