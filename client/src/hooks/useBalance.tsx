import { PgWallet } from "../utils";
import { useRenderOnChange } from "./useRenderOnChange";

/** Get globally synced current wallet's balance. */
export const useBalance = () => useRenderOnChange(PgWallet.onDidChangeBalance);
