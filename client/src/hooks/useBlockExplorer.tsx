import { useRenderOnChange } from "./useRenderOnChange";
import { PgBlockExplorer } from "../utils/pg";

/** Get the current block explorer */
export const useBlockExplorer = () => {
  useRenderOnChange(PgBlockExplorer.onDidChange);
  return PgBlockExplorer.current;
};
