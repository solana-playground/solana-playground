import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../../constants";
import { FRAMEWORKS } from "../../../frameworks";
import { ROUTES } from "../../../routes";
import { TUTORIALS } from "../../../tutorials";
import {
  Disposable,
  PgBlockExplorer,
  PgCommon,
  PgConnection,
  PgExplorer,
  PgFramework,
  PgGlobal,
  PgProgramInfo,
  PgRouter,
  PgTutorial,
  PgWallet,
} from "../../../utils/pg";
import { useDisposable, useGetStatic, useSetStatic } from "../../../hooks";

const GlobalState = () => {
  useDisposable(PgGlobal.init);
  useRouter();
  useWorkspace();
  useDisposable(PgConnection.init);
  useDisposable(PgBlockExplorer.init); // Must be after `PgConnection` init
  useDisposable(PgWallet.init);
  useProgramInfo();

  return null;
};

/** Initialize `PgProgramInfo` on explorer initialization and workspace switch. */
const useProgramInfo = () => {
  useEffect(() => {
    let programInfo: Disposable | undefined;
    const batch = PgCommon.batchChanges(async () => {
      programInfo?.dispose();
      programInfo = await PgProgramInfo.init();
    }, [PgExplorer.onDidInit, PgExplorer.onDidSwitchWorkspace]);

    return () => {
      programInfo?.dispose();
      batch.dispose();
    };
  }, []);
};

/** Handle URL routing. */
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

/** Handle workspaces/tutorials. */
const useWorkspace = () => {
  // Handle loading state
  useEffect(() => {
    const { dispose } = PgExplorer.onDidInit(() => {
      // Check whether the tab state is valid
      // Invalid case: https://github.com/solana-playground/solana-playground/issues/91#issuecomment-1336388179
      if (PgExplorer.tabs.length && !PgExplorer.currentFilePath) {
        PgExplorer.openFile(PgExplorer.tabs[0]);
      }
    });
    return () => dispose();
  }, []);

  // Handle workspace switch
  useEffect(() => {
    const { dispose } = PgExplorer.onDidSwitchWorkspace(async () => {
      const name = PgExplorer.currentWorkspaceName;
      if (!name) {
        PgRouter.navigate();
        return;
      }

      // Non-editor views should not handle tutorials
      // TODO: Add ability to handle this from route creation instead of making
      // changes to the implementation
      const { pathname } = await PgRouter.getLocation();
      if (
        PgRouter.isPathsEqual(pathname, "/tutorials") ||
        PgRouter.isPathsEqual(pathname, "/programs")
      ) {
        return;
      }

      if (PgTutorial.isWorkspaceTutorial(name)) {
        await PgTutorial.open(name);
      } else {
        PgExplorer.setWorkspaceName(name);
        await PgRouter.navigate();
      }
    });
    return () => dispose();
  }, []);
};

// Set frameworks
PgFramework.frameworks = FRAMEWORKS;

// Set tutorials
PgTutorial.tutorials = TUTORIALS;

export default GlobalState;
