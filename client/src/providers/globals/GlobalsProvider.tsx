import { FC, useState } from "react";

import { AppLoading } from "../../components/Loading/App";
import { GLOBALS } from "../../globals";
import { initAll } from "../../utils/pg";
import { useAsyncEffect } from "../../hooks";

export const GlobalsProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useAsyncEffect(async () => {
    setLoading(true);

    try {
      const { dispose } = await initAll(GLOBALS);
      setError("");
      return dispose;
    } catch (e: any) {
      setError(
        `Error during globals initialization: ${
          e.message ?? "Unexpected error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <AppLoading />;
  if (error) return <>{error}</>;
  return <>{children}</>;
};
