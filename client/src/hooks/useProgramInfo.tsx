import { PgProgramInfo } from "../utils";
import { useRenderOnChange } from "./useRenderOnChange";

/** Get the current program info. */
export const useProgramInfo = () => {
  return useRenderOnChange(PgProgramInfo.onDidChange);
};
