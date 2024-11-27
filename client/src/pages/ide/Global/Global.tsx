import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { EventName } from "../../../constants";
import { BLOCK_EXPLORERS } from "../../../block-explorers";
import { COMMANDS } from "../../../commands";
import { FRAMEWORKS } from "../../../frameworks";
import { LANGUAGES } from "../../../languages";
import { ROUTES } from "../../../routes";
import { TUTORIALS } from "../../../tutorials";
import {
  Disposable,
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
  PgTutorial,
  PgWallet,
} from "../../../utils/pg";
import { useDisposable, useSetStatic } from "../../../hooks";

// Set fields
PgBlockExplorer.all = BLOCK_EXPLORERS;
PgCommandManager.all = COMMANDS;
PgFramework.all = FRAMEWORKS;
PgLanguage.all = LANGUAGES;
PgTutorial.all = TUTORIALS;

const GlobalState = () => {
  useDisposable(PgGlobal.init);
  useRouter();
  useExplorer();
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
    return dispose;
  }, []);

  // Location
  const location = useLocation();
  // Change method
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.ROUTER_ON_DID_CHANGE_PATH,
      location.pathname
    );
  }, [location.pathname]);

  // Navigate
  const navigate = useNavigate();
  useSetStatic(navigate, EventName.ROUTER_NAVIGATE);
};

// TODO: Remove and handle this from explorer impl
/** Handle explorer consistency. */
const useExplorer = () => {
  // Handle loading state
  useEffect(() => {
    const { dispose } = PgExplorer.onDidInit(() => {
      // Check whether the tab state is valid
      // Invalid case: https://github.com/solana-playground/solana-playground/issues/91#issuecomment-1336388179
      if (PgExplorer.tabs.length && !PgExplorer.currentFilePath) {
        PgExplorer.openFile(PgExplorer.tabs[0]);
      }
    });
    return dispose;
  }, []);
};

export default GlobalState;
