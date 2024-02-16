import { PgCommon } from "./common";
import { PgTerminal } from "./terminal";
import { GITHUB_URL } from "../../constants";

/** Mapped import results */
interface ImportResult {
  "anchor-cli": typeof import("@solana-playground/anchor-cli");
  playnet: typeof import("@solana-playground/playnet");
  rustfmt: typeof import("@solana-playground/rustfmt");
  "seahorse-compile": typeof import("@solana-playground/seahorse-compile");
  "solana-cli": typeof import("@solana-playground/solana-cli");
  "spl-token-cli": typeof import("@solana-playground/spl-token-cli");
  "sugar-cli": typeof import("@solana-playground/sugar-cli");
}

/** All package names */
type PackageName = keyof ImportResult;

/** Utility class to manage packages */
export class PgPackage {
  /**
   * Import the given package asynchronously.
   *
   * @param opts.log log the import progress to the terminal
   * @returns the imported package
   */
  static async import<T extends PackageName>(name: T, opts?: { log: boolean }) {
    const uiName = this._getUIName(name);
    const log = opts?.log && this._isPkgLoadingInitial(name);
    if (log) PgTerminal.log(PgTerminal.info(`Loading ${uiName}...`));

    try {
      const pkg = (await this._import(name)) as unknown as ImportResult[T];
      if (log) PgTerminal.log(PgTerminal.success("Success.") + "\n");

      return pkg;
    } catch (e: any) {
      throw new Error(
        `Failed to load ${PgTerminal.bold(uiName)}. Reason: ${e.message}
          
If the problem continues, consider filing a bug report in ${PgTerminal.underline(
          GITHUB_URL + "/issues"
        )}`
      );
    }
  }

  /**
   * Import the given package asynchronously.
   *
   * @returns the imported package
   */
  private static async _import(name: PackageName) {
    switch (name) {
      case "anchor-cli":
        return await import("@solana-playground/anchor-cli");
      case "playnet":
        return await import("@solana-playground/playnet");
      case "rustfmt":
        return await import("@solana-playground/rustfmt");
      case "seahorse-compile":
        return await import("@solana-playground/seahorse-compile");
      case "solana-cli":
        return await import("@solana-playground/solana-cli");
      case "spl-token-cli":
        return await import("@solana-playground/spl-token-cli");
      case "sugar-cli":
        return await import("@solana-playground/sugar-cli");
      default:
        throw new Error(`Unknown package \`${name}\``);
    }
  }

  /**
   * Convert the package name to UI name.
   *
   * @param name package name
   * @returns UI name, defaults to title case of the package name
   */
  private static _getUIName(name: PackageName) {
    switch (name) {
      case "seahorse-compile":
        return "Seahorse";
      case "spl-token-cli":
        return "SPL Token CLI";
      default:
        return PgCommon.toTitleFromKebab(name).replace("Cli", "CLI");
    }
  }

  /**
   * Get whether the package is being loaded for the first time and set the
   * package's loaded state to `true`
   *
   * @param name package name
   * @returns `true` if the package hasn't been loaded before
   */
  private static _isPkgLoadingInitial(name: PackageName) {
    const initial = !this._loadedPkgs[name];
    if (initial) {
      this._loadedPkgs[name] = true;
    }

    return initial;
  }

  /** Loaded packages */
  private static readonly _loadedPkgs: { [K in PackageName]?: boolean } = {};
}
