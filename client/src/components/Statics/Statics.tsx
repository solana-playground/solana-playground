import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { EventName } from "../../constants";
import { useExposeStatic, useSetStatic } from "../../hooks";
import { pgWalletAtom, terminalProgressAtom } from "../../state";

const Statics = () => {
  // Wallet
  const [wallet] = useAtom(pgWalletAtom);
  useExposeStatic(wallet, EventName.WALLET_STATIC);

  // Connection
  const { connection } = useConnection();
  useExposeStatic(connection, EventName.CONNECTION_STATIC);

  // Terminal progress
  const [, setProgress] = useAtom(terminalProgressAtom);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);

  return null;
};

export default Statics;
