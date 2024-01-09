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
  return {
    explorer: opts?.checkInitialization
      ? PgExplorer.isInitialized
        ? PgExplorer
        : null
      : PgExplorer,
  } as {
    explorer: C extends true ? typeof PgExplorer | null : typeof PgExplorer;
  };
};
