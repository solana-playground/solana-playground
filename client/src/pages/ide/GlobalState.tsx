import { useAtom } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../constants";
import {
  useDisposable,
  useGetAndSetStatic,
  useGetStatic,
  useSetStatic,
} from "../../hooks";
import { terminalProgressAtom, tutorialAtom } from "../../state";
import {
  Disposable,
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
  useEffect(() => {
    let disposeProgramInfo: Disposable | undefined;
    const { dispose } = PgExplorer.onDidSwitchWorkspace(async () => {
      disposeProgramInfo?.dispose();
      disposeProgramInfo = await PgProgramInfo.init();
    });

    return () => dispose();
  }, []);
};

export default GlobalState;
