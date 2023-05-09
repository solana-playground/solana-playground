import { DependencyList, useEffect } from "react";

import type { Fn } from "../utils/pg";

/**
 * Async version of the `useEffect` hook.
 *
 * NOTE: Be careful when using this hook with a callback that subscribes to changes
 * (especially nested subscribes) because it could potentially not get cleaned up.
 *
 * @param cb callback function to run
 * @param deps `useEffect` dependency array
 */
export const useAsyncEffect = (
  cb: () => Promise<Fn | void>,
  deps?: DependencyList
) => {
  useEffect(
    () => {
      let returned = false;
      let ret: Fn | void;

      (async () => {
        ret = await cb();
        if (returned) ret?.();
      })();

      return () => {
        returned = true;
        ret?.();
      };
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
};
