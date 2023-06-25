import { useAtom } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { TUTORIALS } from "../../tutorials";
import { EventName } from "../../constants";
import { terminalProgressAtom } from "../../state";
import {
  Disposable,
  PgCommon,
  PgConnection,
  PgExplorer,
  PgProgramInfo,
  PgRouter,
  PgTutorial,
  PgWallet,
} from "../../utils/pg";
import { useDisposable, useGetStatic, useSetStatic } from "../../hooks";

const GlobalState = () => {
  // Connection
  useDisposable(PgConnection.init);

  // Program info
  useProgramInfo();

  // Router
  useRouter();

  // Terminal progress
  const [, setProgress] = useAtom(terminalProgressAtom);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);

  // Wallet
  useDisposable(PgWallet.init);

  return null;
};

/**
 * Initialize `PgProgramInfo` each time the current workspace changes.
 *
 * **IMPORTANT**: Should only be used once.
 */
const useProgramInfo = () => {
  useEffect(() => {
    let programInfo: Disposable | undefined;
    const explorerInit = PgExplorer.onDidInit(async () => {
      programInfo?.dispose();
      programInfo = await PgProgramInfo.init();
    });

    return () => {
      programInfo?.dispose();
      explorerInit.dispose();
    };
  }, []);
};

/**
 * Handle URL routing.
 *
 * **IMPORTANT**: Should only be used once.
 */
const useRouter = () => {
  // Init
  useEffect(() => {
    const { dispose } = PgRouter.init(ROUTES);
    return () => dispose();
  }, []);

  // Location
  const location = useLocation();
  useGetStatic(location, EventName.ROUTER_LOCATION);

  // Navigate
  const navigate = useNavigate();
  useSetStatic(navigate, EventName.ROUTER_NAVIGATE);

  // Change method
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.ROUTER_ON_DID_CHANGE_PATH,
      location.pathname
    );
  }, [location.pathname]);
};

// Set tutorials
PgTutorial.tutorials = TUTORIALS;

export default GlobalState;
