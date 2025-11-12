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
import { useDisposable } from "../../hooks";

// Set fields
PgBlockExplorer.all = BLOCK_EXPLORERS;
PgCommandManager.all = COMMANDS;
PgFramework.all = FRAMEWORKS;
PgLanguage.all = LANGUAGES;
PgRouter.all = ROUTES;
PgSettings.all = SETTINGS;
PgTutorial.all = TUTORIALS;
PgView.allSidebarPages = SIDEBAR;

// All initables to initialize
const INITABLES = [
  // Initialize settings first, since others may depend on it
  PgSettings,
  PgBlockExplorer,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgRouter,
  PgTutorial,
  PgView,
  PgWallet,
];
const getInitables = () => initAll(INITABLES);

const Global = () => {
  useDisposable(getInitables);
  return null;
};

export default Global;
