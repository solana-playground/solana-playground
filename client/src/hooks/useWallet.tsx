import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useWallet = () => {
  return useRenderOnChange(PgWallet.onDidChangeCurrent);
};
