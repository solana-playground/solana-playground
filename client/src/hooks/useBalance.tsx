import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

/** Get globally synced current wallet's balance. */
export const useBalance = () => {
  useRenderOnChange(PgWallet.onDidChangeBalance);
  return { balance: PgWallet.balance };
};
