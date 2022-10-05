import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { EventName } from "../../constants";
import { useExposeStatic } from "../../hooks";
import { pgWalletAtom } from "../../state";

const Statics = () => {
  // Wallet
  const [wallet] = useAtom(pgWalletAtom);
  useExposeStatic(wallet, EventName.WALLET_STATIC);

  // Connection
  const { connection } = useConnection();
  useExposeStatic(connection, EventName.CONNECTION_STATIC);

  return null;
};

export default Statics;
