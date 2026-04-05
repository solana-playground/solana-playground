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
      const { dispose } = await initAll(GLOBALS);
      return dispose;
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
