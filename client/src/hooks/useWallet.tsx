import { PgWallet } from "../utils";
import { useRenderOnChange } from "./useRenderOnChange";

export const useWallet = () => {
  return useRenderOnChange(PgWallet.onDidChangeCurrent);
};
