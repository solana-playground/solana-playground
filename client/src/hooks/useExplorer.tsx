import { PgExplorer } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/** Global explorer */
export const useExplorer = () => {
  useRenderOnChange(PgExplorer.onNeedRender);
  return { explorer: PgExplorer };
};
