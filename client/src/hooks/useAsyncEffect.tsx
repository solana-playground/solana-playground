import { DependencyList, useEffect, useState } from "react";

import type { Fn } from "../utils";

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
  const [, setError] = useState();
  useEffect(
    () => {
      let returned = false;
      let ret: Awaited<ReturnType<typeof cb>>;

      (async () => {
        try {
          ret = await cb();
        } catch (e) {
          // Error boundaries do not catch promise errors.
          // See https://github.com/facebook/react/issues/11334
          //
          // As a workaround, the following line manually triggers a render
          // error that can get caught by the `ErrorBoundary` component.
          setError(() => {
            throw e;
          });
        } finally {
          if (returned) ret?.();
        }
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
