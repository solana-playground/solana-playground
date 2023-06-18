import { useEffect } from "react";

import { useWallet } from "../../../hooks";
import { PgWallet } from "../../../utils/pg";

/**
 * Update the standard wallet when the user switches between accounts.
 *
 * This only applies to Standard Wallets.
 */
export const useStandardAccountChange = () => {
  const { wallet } = useWallet();

  useEffect(() => {
    if (!wallet || wallet.isPg) return;

    // Derive the standard wallet
    const handleStandardAccountChange = () => {
      PgWallet.update({ standardName: PgWallet.standardName });
    };

    wallet.on("connect", handleStandardAccountChange);

    return () => {
      wallet.off("connect", handleStandardAccountChange);
    };
  }, [wallet]);
};
