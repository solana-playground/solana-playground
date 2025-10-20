import { PgProgramInfo } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/** Get the current program info. */
export const useProgramInfo = () => {
  useRenderOnChange(PgProgramInfo.onDidChange);
  return PgProgramInfo;
};
