import { GITHUB_URL } from "../../../constants";
import { PgTerminal } from "./terminal";

export interface Pkgs {
  compileSeahorse?: (pythonSource: string, programName: string) => string;
  runSolana?: (
    arg: string,
    endpoint: string,
    commitment: string,
    keypairBytes: Uint8Array
  ) => void;
  runSplToken?: (
    arg: string,
    endpoint: string,
    commitment: string,
    keypairBytes: Uint8Array
  ) => void;
  runSugar?: (arg: string) => Promise<void>;
  rustfmt?: (input: string) => {
    code: () => string;
    error: () => string | undefined;
  };
}

export interface PkgInfo {
  name: PkgName;
  uiName: PkgUiName;
}

export enum PkgName {
  RUSTFMT = "rustfmt",
  SEAHORSE_COMPILE = "seahorse-compile",
  SOLANA_CLI = "solana-cli",
  SPL_TOKEN_CLI = "spl-token-cli",
  SUGAR_CLI = "sugar-cli",
}

enum PkgUiName {
  RUSTFMT = "Rustfmt",
  SEAHORSE_COMPILE = "Seahorse",
  SOLANA_CLI = "Solana CLI",
  SPL_TOKEN_CLI = "SPL Token CLI",
  SUGAR_CLI = "Sugar CLI",
}

export class PgPkg {
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
   * Imports the given package asynchronously
   * @returns the imported package
   */
  private static async _loadPkg(pkgName: PkgName) {
    switch (pkgName) {
      case PkgName.RUSTFMT:
        return await import("@solana-playground/rustfmt-wasm");
      case PkgName.SEAHORSE_COMPILE:
        return await import("@solana-playground/seahorse-compile-wasm");
      case PkgName.SOLANA_CLI:
        return await import("@solana-playground/solana-cli-wasm");
      case PkgName.SPL_TOKEN_CLI:
        return await import("@solana-playground/spl-token-cli-wasm");
      case PkgName.SUGAR_CLI:
        return await import("@solana-playground/sugar-cli-wasm");
    }
  }
}
