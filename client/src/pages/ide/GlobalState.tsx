import { useAtom } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../constants";
import {
  useAsyncEffect,
  useDisposable,
  useGetAndSetStatic,
  useGetStatic,
  useSetStatic,
} from "../../hooks";
import { terminalProgressAtom, tutorialAtom } from "../../state";
import {
  PgConnection,
  PgExplorer,
  PgProgramInfo,
  PgWallet,
} from "../../utils/pg";

const GlobalState = () => {
  // Connection
  useDisposable(PgConnection.init);

  // Program info
  useProgramInfoStatic();

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
  useDisposable(PgWallet.init);

  return null;
};

/**
 * Initialize `PgProgramInfo` each time the current workspace changes.
 *
 * **IMPORTANT**: Should only be used once.
 */
const useProgramInfoStatic = () => {
  useAsyncEffect(async () => {
    let programInfo = await PgProgramInfo.init();
    const switchWorkspace = PgExplorer.onDidSwitchWorkspace(async () => {
      programInfo?.dispose();
      programInfo = await PgProgramInfo.init();
    });

    return () => {
      programInfo.dispose();
      switchWorkspace.dispose();
    };
  }, []);
};

export default GlobalState;
