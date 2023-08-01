import "styled-components";

import { COMMANDS } from "../commands";
import { ROUTES } from "../routes";
import { SIDEBAR } from "../views";
import { Arrayable, Disposable, SyncOrAsync, ThemeReady } from "../utils/pg";

global {
  function structuredClone<T>(obj: T): T;

  /** Rust Analyzer crates. */
  const CRATES: string[];
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

  /** Name of all the available commands(only code) */
  type CommandCodeName = keyof InternalCommands;

  /** Ready to be used commands */
  type Commands = {
    [N in keyof InternalCommands]: InternalCommands[N] extends CommandImpl<
      infer R
    >
      ? Command<R>
      : never;
  };

  /** Command type for external usage */
  type Command<R> = Pick<CommandImpl<R>, "name"> & {
    /** Command processor */
    run(args?: string): Promise<Awaited<R>>;
    /**
     * @param cb callback function to run when the command starts running
     * @returns a dispose function to clear the event
     */
    onDidRunStart(cb: (input: string | null) => void): Disposable;
    /**
     * @param cb callback function to run when the command finishes running
     * @returns a dispose function to clear the event
     */
    onDidRunFinish(cb: (result: Awaited<R>) => void): Disposable;
  };

  /** Terminal command implementation */
  type CommandImpl<R> = {
    /** Name of the command that will be used in terminal */
    name: string;
    /** Description that will be seen in the `help` command */
    description: string;
    /** Function to run when the command is called */
    run: (input: string) => R;
    /* Only process the command if the condition passes */
    preCheck?: Arrayable<() => SyncOrAsync<void>>;
  };
}

declare module "styled-components" {
  export interface DefaultTheme extends ThemeReady {}
}
