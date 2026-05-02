import { FC, useState } from "react";

import { AppLoading } from "../../components/Loading/App";
import { GLOBALS } from "../../globals";
import { initAll } from "../../utils";
import { useAsyncEffect } from "../../hooks";

export const GlobalsProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useAsyncEffect(async () => {
    setLoading(true);

    try {
      // Intentionally do not dispose globals because:
      //
      // - It makes app crashes irrecoverable, at least without state corruption or
      //   unintended behavior (e.g. effects leakage).
      // - It causes the app to crash in some cases after auto-refresh during
      //   local development.
      await initAll(GLOBALS);
    } catch (e: any) {
      throw new Error(
        `Error during globals initialization: ${
          e.message ?? "Unexpected error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <AppLoading />;
  return <>{children}</>;
};
