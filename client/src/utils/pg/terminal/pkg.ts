import { GITHUB_URL } from "../../../constants";
import { PgTerminal } from "./terminal";

export interface Pkgs {
  Playnet?: typeof import("@solana-playground/playnet").Playnet;
  compileSeahorse?: typeof import("@solana-playground/seahorse-compile").compileSeahorse;
  runAnchor?: typeof import("@solana-playground/anchor-cli").runAnchor;
  runSolana?: typeof import("@solana-playground/solana-cli").runSolana;
  runSplToken?: typeof import("@solana-playground/spl-token-cli").runSplToken;
  runSugar?: typeof import("@solana-playground/sugar-cli").runSugar;
  rustfmt?: typeof import("@solana-playground/rustfmt").rustfmt;
}

export interface PkgInfo {
  name: PkgName;
  uiName: PkgUiName;
}

export enum PkgName {
  ANCHOR_CLI = "anchor-cli",
  PLAYNET = "playnet",
  RUSTFMT = "rustfmt",
  SEAHORSE_COMPILE = "seahorse-compile",
  SOLANA_CLI = "solana-cli",
  SPL_TOKEN_CLI = "spl-token-cli",
  SUGAR_CLI = "sugar-cli",
}

enum PkgUiName {
  ANCHOR_CLI = "Anchor CLI",
  PLAYNET = "Playnet",
  RUSTFMT = "Rustfmt",
  SEAHORSE_COMPILE = "Seahorse",
  SOLANA_CLI = "Solana CLI",
  SPL_TOKEN_CLI = "SPL Token CLI",
  SUGAR_CLI = "Sugar CLI",
}

export class PgPkg {
  static readonly ANCHOR_CLI: PkgInfo = {
    name: PkgName.ANCHOR_CLI,
    uiName: PkgUiName.ANCHOR_CLI,
  };
  static readonly PLAYNET: PkgInfo = {
    name: PkgName.PLAYNET,
    uiName: PkgUiName.PLAYNET,
  };
  static readonly RUSTFMT: PkgInfo = {
    name: PkgName.RUSTFMT,
    uiName: PkgUiName.RUSTFMT,
  };
  static readonly SEAHORSE_COMPILE: PkgInfo = {
    name: PkgName.SEAHORSE_COMPILE,
    uiName: PkgUiName.SEAHORSE_COMPILE,
  };
  static readonly SOLANA_CLI: PkgInfo = {
    name: PkgName.SOLANA_CLI,
    uiName: PkgUiName.SOLANA_CLI,
  };
  static readonly SPL_TOKEN_CLI: PkgInfo = {
    name: PkgName.SPL_TOKEN_CLI,
    uiName: PkgUiName.SPL_TOKEN_CLI,
  };
  static readonly SUGAR_CLI: PkgInfo = {
    name: PkgName.SUGAR_CLI,
    uiName: PkgUiName.SUGAR_CLI,
  };

  /**
   * Imports the given package asynchronously
   *
   * @param opts.log log the progress to the terminal
   * @returns the imported package
   */
  static async loadPkg(
    pkgInfo: PkgInfo,
    opts?: { log: boolean }
  ): Promise<Pkgs> {
    const log = opts?.log;
    if (log) {
      PgTerminal.log(PgTerminal.info(`Loading ${pkgInfo.uiName}...`));
    }

    let resultMsg;
    try {
      const pkg = await this._loadPkg(pkgInfo.name);

      resultMsg = `${PgTerminal.success("Success.")}`;

      return pkg;
    } catch (e: any) {
      resultMsg = `${PgTerminal.error("Error")} loading ${
        pkgInfo.uiName
      }. Please consider filing a bug report in ${PgTerminal.underline(
        GITHUB_URL + "/issues"
      )}
      Error reason: ${e.message}`;

      PgTerminal.enable();

      throw new Error(resultMsg);
    } finally {
      if (log) PgTerminal.log(resultMsg + "\n");
    }
  }

  /**
   * Import the given package asynchronously
   *
   * @returns the imported package
   */
  private static async _loadPkg(pkgName: PkgName) {
    switch (pkgName) {
      case PkgName.ANCHOR_CLI:
        return await import("@solana-playground/anchor-cli");
      case PkgName.PLAYNET:
        return await import("@solana-playground/playnet");
      case PkgName.RUSTFMT:
        return await import("@solana-playground/rustfmt");
      case PkgName.SEAHORSE_COMPILE:
        return await import("@solana-playground/seahorse-compile");
      case PkgName.SOLANA_CLI:
        return await import("@solana-playground/solana-cli");
      case PkgName.SPL_TOKEN_CLI:
        return await import("@solana-playground/spl-token-cli");
      case PkgName.SUGAR_CLI:
        return await import("@solana-playground/sugar-cli");
    }
  }
}
