import { useAtom } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../constants";
import {
  useExposeStatic,
  useGetAndSetStatic,
  useGetStatic,
  usePgConnectionStatic,
  useSetStatic,
} from "../../hooks";
import {
  uiBalanceAtom,
  explorerAtom,
  pgWalletAtom,
  terminalProgressAtom,
  tutorialAtom,
} from "../../state";

const useStatics = () => {
  // Balance
  const [, setBalance] = useAtom(uiBalanceAtom);
  useSetStatic(setBalance, EventName.WALLET_UI_BALANCE_SET);

  // Connection
  const [connection, setConnection] = usePgConnectionStatic();
  useGetAndSetStatic(connection, setConnection, EventName.CONNECTION_STATIC);

  // Explorer
  const [explorer] = useAtom(explorerAtom);
  useExposeStatic(explorer, EventName.EXPLORER_STATIC);

  // Router location
  const location = useLocation();
  useGetStatic(location, EventName.ROUTER_LOCATION);

  // Router navigate
  const navigate = useNavigate();
  useSetStatic(navigate, EventName.ROUTER_NAVIGATE);

  // Terminal progress
  const [, setProgress] = useAtom(terminalProgressAtom);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);

  // Tutorial
  const [tutorial, setTutorial] = useAtom(tutorialAtom);
  useGetAndSetStatic(tutorial, setTutorial, EventName.TUTORIAL_STATIC);

  // Wallet
  const [wallet] = useAtom(pgWalletAtom);
  useExposeStatic(wallet, EventName.WALLET_STATIC);
};

export default useStatics;
