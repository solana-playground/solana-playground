import { useMemo } from "react";
import { useAtom } from "jotai";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";

import { pgWalletAtom, refreshPgWalletAtom } from "../../../state";
import { PgWallet } from "../../../utils/pg";

const useCurrentWallet = () => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const wallet = useAnchorWallet();

  const [currentWallet, walletPkStr] = useMemo(() => {
    let currentWallet: PgWallet | AnchorWallet | null = null;
    // Priority is external wallet
    if (wallet) currentWallet = wallet;
    else if (pgWallet.connected) currentWallet = pgWallet;

    return [currentWallet, currentWallet?.publicKey.toBase58() ?? ""];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, pgWallet, pgWalletChanged]);

  return {
    currentWallet,
    walletPkStr,
    pgWalletPk: pgWallet.connected && pgWallet.publicKey,
    solWalletPk: wallet?.publicKey,
  };
};

export default useCurrentWallet;
