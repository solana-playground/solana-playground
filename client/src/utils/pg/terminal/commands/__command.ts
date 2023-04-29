import { PkgName } from "../pkg";

/** Terminal command */
interface Command<R> {
  /** Name of the command */
  name: string;
  /** Description that will be seen in the `help` command */
  description: string;
  /** Function to run when the command is called */
  process: (input: string) => R;
  /* Only process the command if the condition passes */
  preCheck?: () => boolean;
}

/** Utilities for commands */
export class PgCommandHelper {
  /**
   * Create a command. This is only a type helper function.
   *
   * @param cmd command to create
   * @returns the command with `Command` type
   */
  static create<R>(cmd: Command<R>): Readonly<Command<R>> {
    return cmd;
  }

  /**
   * Get whether the package is being loaded for the first time and set the
   * package's loaded state to `true`
   *
   * @param pkgName package name
   * @returns `true` if the package hasn't been loaded before
   */
  static isPkgLoadingInitial(pkgName: PkgName) {
    const initial = !this._loadedPkgs[pkgName];
    if (initial) {
      this._loadedPkgs[pkgName] = true;
    }

    return initial;
  }

  /** Loaded packages */
  private static readonly _loadedPkgs: { [pkgName: string]: boolean } = {};
}
