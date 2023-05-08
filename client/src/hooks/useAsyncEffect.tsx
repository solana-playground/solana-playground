import { DependencyList, useEffect } from "react";

import type { Fn } from "../utils/pg";

export const useAsyncEffect = (
  cb: () => Promise<Fn | void>,
  deps?: DependencyList
) => {
  useEffect(() => {
    (async () => {
      const ret = await cb();
      return ret?.();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
