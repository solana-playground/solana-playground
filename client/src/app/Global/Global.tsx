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
  initAll,
  PgBlockExplorer,
  PgCommandManager,
  PgCommon,
  PgConnection,
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
const INITABLES = [
  PgBlockExplorer,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgTutorial,
  PgWallet,
];

const Global = () => {
  useDisposable(() => initAll(INITABLES));
  useRouter();

  return null;
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

export default Global;
