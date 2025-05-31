import "styled-components";

import { COMMANDS } from "../commands";
import { FRAMEWORKS } from "../frameworks";
import { LANGUAGES } from "../languages";
import { ROUTES } from "../routes";
import { MAIN_SECONDARY, SIDEBAR } from "../views";
import { SETTINGS } from "../settings";
import {
  Arrayable,
  ClientPackageName,
  Disposable,
  OrString,
  SyncOrAsync,
  Theme,
  TutorialDataParam,
} from "../utils/pg";

/** Global overrides */
global {
  /** Deep clone an object with correct return type. */
  function structuredClone<T>(obj: T): T;
}

/** Webpack defined globals */
global {
  /** Rust Analyzer crates */
  const CRATES: { importable: string[]; transitive: string[] };

  /** Supported client packages */
  const PACKAGES: {
    global: {
      [K in ClientPackageName]:
        | { as: string }
        | { named: string }
        | { default: string };
    };
    importable: ClientPackageName[];
  };

  /** Array of all markdown tutorial data */
  const MARKDOWN_TUTORIALS: TutorialDataParam[];

  /** Map of kebab-case tutorial names to necessary custom tutorial data */
  const CUSTOM_TUTORIALS: {
    [tutorialName: string]: { pageCount: number; thumbnail: string };
  };
}

// Framework name
global {
  /** Framework names */
  type FrameworkName = typeof FRAMEWORKS[number]["name"];
}

// Language name
global {
  /** Language names */
  type LanguageName = typeof LANGUAGES[number]["name"];
}

// Route
global {
  /** All route path names */
  type RoutePath = OrString<typeof ROUTES[number]["path"]>;
}

// View
global {
  /** All sidebar page names */
  type SidebarPageName = typeof SIDEBAR[number]["name"];

  /** All secondary main view page names */
  type MainSecondaryPageName = typeof MAIN_SECONDARY[number]["name"];
}

// Commands
global {
  /** All internal commands type */
  type InternalCommands = typeof COMMANDS;
}

// Settings
global {
  /** Internal settings array */
  type InternalSettings = typeof SETTINGS;
}

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
