import "styled-components";

import { COMMANDS } from "../commands";
import { FRAMEWORKS } from "../frameworks";
import { ROUTES } from "../routes";
import { SIDEBAR } from "../views";
import {
  Arrayable,
  ClientPackageName,
  Disposable,
  SyncOrAsync,
  ThemeReady,
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

  /** Map of kebab-case tutorial names to thumbnail file names */
  const TUTORIAL_THUMBNAIL_MAP: { [tutorialName: string]: string };
}

// Framework name
global {
  /** Framework names */
  type FrameworkName = typeof FRAMEWORKS[number]["name"];
}

// Route
global {
  /** All route path names */
  type RoutePath = typeof ROUTES[number]["path"];
}

// View
global {
  /** All sidebar page names */
  type SidebarPageName = typeof SIDEBAR[number]["name"];
}

// Commands
global {
  /** All internal commands type */
  type InternalCommands = typeof COMMANDS;
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeReady {}
}
