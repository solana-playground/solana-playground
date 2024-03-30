import { useMemo } from "react";

import { useRenderOnChange } from "./useRenderOnChange";
import { PgBlockExplorer, PgConnection, PgSettings } from "../utils/pg";

/** Get the current block explorer */
export const useBlockExplorer = () => {
  const blockExplorer = useRenderOnChange(
    PgSettings.onDidChangeOtherBlockExplorer
  );
  const cluster = useRenderOnChange(PgConnection.onDidChangeCluster);

  return useMemo(
    () => PgBlockExplorer.get(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockExplorer, cluster]
  );
};
