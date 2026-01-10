import { useRenderOnChange } from "./useRenderOnChange";
import { PgBlockExplorer } from "../utils";

/** Get the current block explorer */
export const useBlockExplorer = () => {
  return useRenderOnChange(PgBlockExplorer.onDidChangeCurrent);
};
