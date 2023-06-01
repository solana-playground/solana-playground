import { PgConnection } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/**
 * Get access to Playnet compatible globally synced `Connection` object.
 */
export const usePgConnection = () => {
  useRenderOnChange(PgConnection.onDidChangeConnection);
  return { connection: PgConnection.connection };
};
