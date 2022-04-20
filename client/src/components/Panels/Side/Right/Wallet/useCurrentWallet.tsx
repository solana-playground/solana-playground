import { useMemo } from "react";
import { useAtom } from "jotai";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";

import { pgWalletAtom, refreshPgWalletAtom } from "../../../../../state/solana";
import { PgWallet } from "../../../../../utils/pg/wallet";

const useCurrentWallet = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const wallet = useAnchorWallet();

  const currentWallet = useMemo(() => {
    let currentWallet: PgWallet | AnchorWallet | null = null;
    if (wallet) currentWallet = wallet;
    else if (pgWallet.connected) currentWallet = pgWallet;

    return currentWallet;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, pgWallet, pgWalletChanged]);

  const walletPkStr = useMemo(() => {
    return currentWallet?.publicKey.toBase58() ?? "";
  }, [currentWallet]);

  return {
    currentWallet,
    walletPkStr,
    pgWalletPk: pgWallet.connected && pgWallet.publicKey,
    solWalletPk: wallet?.publicKey,
  };
};

export default useCurrentWallet;
