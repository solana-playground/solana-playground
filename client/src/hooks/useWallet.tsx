import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useWallet = () => {
  useRenderOnChange(PgWallet.onDidChangeCurrent);
  return {
    wallet: PgWallet.current,
    walletPkStr: PgWallet.current?.publicKey?.toBase58(),
  };
};
