import { FC, useState } from "react";

import { AppLoading } from "../../components/Loading/App";
import { GLOBALS } from "../../globals";
import { initAll } from "../../utils";
import { useAsyncEffect } from "../../hooks";

export const GlobalsProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [, setError] = useState();

  useAsyncEffect(async () => {
    setLoading(true);

    try {
      const { dispose } = await initAll(GLOBALS);
      return dispose;
    } catch (e: any) {
      // Error boundaries do not catch promise errors.
      // See https://github.com/facebook/react/issues/11334
      //
      // As a workaround, the following line manually triggers a render error,
      // which is then caught by the parent `ErrorBoundary` component.
      setError(() => {
        throw new Error(
          `Error during globals initialization: ${
            e.message ?? "Unexpected error"
          }`
        );
      });
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <AppLoading />;
  return <>{children}</>;
};
