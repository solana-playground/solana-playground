import { useAsyncEffect } from "./useAsyncEffect";
import type { Disposable, SyncOrAsync } from "../utils/pg";

/** Run the given callback on mount and dispose it on unmount. */
export const useDisposable = (disposable: () => SyncOrAsync<Disposable>) => {
  useAsyncEffect(async () => {
    const { dispose } = await disposable();
    return () => dispose();
  }, [disposable]);
};
