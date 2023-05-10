import { useAnchorWallet } from "@solana/wallet-adapter-react";

import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useCurrentWallet = () => {
  const pgWallet = useRenderOnChange(PgWallet.onDidUpdate);
  const solWallet = useAnchorWallet();

  const pgWalletReturn = pgWallet?.isConnected ? PgWallet : null;
  const wallet = solWallet ?? pgWalletReturn;
  const walletPkStr = wallet?.publicKey.toBase58();

  return {
    wallet,
    walletPkStr,
    pgWallet: pgWalletReturn,
    pgWalletPk: pgWalletReturn?.publicKey,
    solWalletPk: solWallet?.publicKey,
  };
};
