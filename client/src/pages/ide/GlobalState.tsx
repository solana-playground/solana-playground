import { useAtom } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../constants";
import {
  useAsyncEffect,
  useDisposable,
  useExposeStatic,
  useGetAndSetStatic,
  useGetStatic,
  useSetStatic,
} from "../../hooks";
import { explorerAtom, terminalProgressAtom, tutorialAtom } from "../../state";
import {
  Disposable,
  PgExplorer,
  PgProgramInfo,
  PgWallet,
  PgConnection,
} from "../../utils/pg";

const GlobalState = () => {
  // Connection
  useDisposable(PgConnection.init);

  // Explorer
  const [explorer] = useAtom(explorerAtom);
  useExposeStatic(explorer, EventName.EXPLORER_STATIC);

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
    const explorer = await PgExplorer.get();
    let disposeProgramInfo: Disposable | undefined;
    const { dispose } = explorer.onDidChangeWorkspace(async () => {
      disposeProgramInfo?.dispose();
      disposeProgramInfo = await PgProgramInfo.init();
    });

    return () => dispose();
  }, []);
};

export default GlobalState;
