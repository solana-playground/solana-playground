import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { BLOCK_EXPLORERS } from "../../block-explorers";
import { COMMANDS } from "../../commands";
import { FRAMEWORKS } from "../../frameworks";
import { LANGUAGES } from "../../languages";
import { ROUTES } from "../../routes";
import { TUTORIALS } from "../../tutorials";
import { SIDEBAR } from "../../views";
import { SETTINGS } from "../../settings";
import {
  Disposable,
  initAll,
  PgBlockExplorer,
  PgCommandManager,
  PgCommon,
  PgConnection,
  PgExplorer,
  PgFramework,
  PgGlobal,
  PgLanguage,
  PgProgramInfo,
  PgRouter,
  PgSettings,
  PgTutorial,
  PgView,
  PgWallet,
} from "../../utils/pg";
import { useDisposable, useGetStatic } from "../../hooks";

// Set fields
PgBlockExplorer.all = BLOCK_EXPLORERS;
PgCommandManager.all = COMMANDS;
PgFramework.all = FRAMEWORKS;
PgLanguage.all = LANGUAGES;
PgRouter.all = ROUTES;
PgTutorial.all = TUTORIALS;
PgView.sidebar = SIDEBAR;
PgSettings.all = SETTINGS;

// All initables to initialize
const INITABLES = [PgBlockExplorer, PgConnection, PgGlobal, PgWallet];

const Global = () => {
  useDisposable(() => initAll(INITABLES));
  useRouter();
  useProgramInfo();
  useTutorial();

  return null;
};

// TODO: Handle this functionality in `PgProgramInfo` (`updatable` decorator).
// We should just be able to add `PgProgramInfo` to `INITABLES` and remove this.
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
    const { dispose } = PgRouter.init();
    return dispose;
  }, []);

  // Location
  const location = useLocation();

  // Path
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      PgRouter.events.ON_DID_CHANGE_PATH,
      location.pathname
    );
  }, [location.pathname]);

  // Hash
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      PgRouter.events.ON_DID_CHANGE_HASH,
      location.hash
    );
  }, [location.hash]);

  // Navigate
  const navigate = useNavigate();
  useGetStatic(PgRouter.events.NAVIGATE, navigate);
};

// TODO: Find a way to handle this from `PgTutorial`
/** Navigate to tutorial's route when necessary. */
const useTutorial = () => {
  useEffect(() => {
    const { dispose } = PgCommon.batchChanges(() => {
      // Don't change the UI to avoid flickering if the current workspace is
      // a tutorial but the user is on route `/`
      if (PgRouter.location.pathname === "/") {
        const workspaceName = PgExplorer.currentWorkspaceName;
        if (workspaceName && PgTutorial.isWorkspaceTutorial(workspaceName)) {
          PgTutorial.open(workspaceName);
        }
      }
    }, [PgRouter.onDidChangePath, PgExplorer.onDidInit]);
    return dispose;
  }, []);
};

export default Global;
