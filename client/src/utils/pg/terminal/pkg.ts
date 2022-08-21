export interface Pkgs {
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
  compileSeahorse?: (pythonSource: string, programName: string) => string;
}

export interface PkgInfo {
  name: PkgName;
  uiName: PkgUiName;
}

export enum PkgName {
  SOLANA_CLI = "solana-cli",
  SPL_TOKEN_CLI = "spl-token-cli",
  SEAHORSE_COMPILE = "seahorse-compile",
}

enum PkgUiName {
  SOLANA_CLI = "Solana CLI",
  SPL_TOKEN_CLI = "SPL Token CLI",
}

export class PgPkg {
  static readonly SOLANA_CLI: PkgInfo = {
    name: PkgName.SOLANA_CLI,
    uiName: PkgUiName.SOLANA_CLI,
  };
  static readonly SPL_TOKEN_CLI: PkgInfo = {
    name: PkgName.SPL_TOKEN_CLI,
    uiName: PkgUiName.SPL_TOKEN_CLI,
  };

  /**
   * Imports the given package asynchronously
   * @returns the imported package
   */
  static async loadPkg(pkgName: PkgName): Promise<Pkgs> {
    switch (pkgName) {
      case PkgName.SOLANA_CLI:
        return await import("@solana-playground/solana-cli-wasm");
      case PkgName.SPL_TOKEN_CLI:
        return await import("@solana-playground/spl-token-cli-wasm");
      case PkgName.SEAHORSE_COMPILE:
        return await import("@solana-playground/seahorse-compile-wasm");
    }
  }
}
