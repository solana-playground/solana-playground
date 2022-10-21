import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import { EventName } from "../../constants";
import { useExposeStatic, useGetAndSetStatic, useSetStatic } from "../../hooks";
import {
  explorerAtom,
  pgWalletAtom,
  terminalProgressAtom,
  tutorialAtom,
} from "../../state";

const Statics = () => {
  // Connection
  const { connection } = useConnection();
  useExposeStatic(connection, EventName.CONNECTION_STATIC);

  // Explorer
  const [explorer] = useAtom(explorerAtom);
  useExposeStatic(explorer, EventName.EXPLORER_STATIC);

  // Terminal progress
  const [, setProgress] = useAtom(terminalProgressAtom);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);

  // Tutorial
  const [tutorial, setTutorial] = useAtom(tutorialAtom);
  useGetAndSetStatic(tutorial, setTutorial, EventName.TUTORIAL_STATIC);

  // Wallet
  const [wallet] = useAtom(pgWalletAtom);
  useExposeStatic(wallet, EventName.WALLET_STATIC);

  return null;
};

export default Statics;
