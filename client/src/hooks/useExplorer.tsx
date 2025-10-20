import { PgExplorer } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/**
 * Globally synced explorer.
 *
 * @param checkInitialization whether to check whether the explorer is initialized
 * @returns the global explorer object
 */
export const useExplorer = <C,>(opts?: { checkInitialization?: C }) => {
  useRenderOnChange(PgExplorer.onNeedRender);
  return (
    opts?.checkInitialization
      ? PgExplorer.isInitialized
        ? PgExplorer
        : null
      : PgExplorer
  ) as C extends true ? typeof PgExplorer | null : typeof PgExplorer;
};
