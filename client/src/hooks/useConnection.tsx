import { PgConnection } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/** Get access to Playnet compatible globally synced `Connection` object. */
export const useConnection = () => {
  useRenderOnChange(PgConnection.onDidChangeIsConnected);
  return useRenderOnChange(PgConnection.onDidChangeCurrent);
};
