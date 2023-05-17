import { useEffect } from "react";

import type { PgDisposable } from "../utils/pg";

/** Run the given callback on mount and dispose it on unmount. */
export const useDisposable = (disposable: () => PgDisposable) => {
  useEffect(() => {
    const { dispose } = disposable();
    return () => dispose();
  }, [disposable]);
};
