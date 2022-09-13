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
}

enum PkgUiName {
  RUSTFMT = "Rustfmt",
  SOLANA_CLI = "Solana CLI",
  SPL_TOKEN_CLI = "SPL Token CLI",
}

export class PgPkg {
  static readonly RUSTFMT: PkgInfo = {
    name: PkgName.RUSTFMT,
    uiName: PkgUiName.RUSTFMT,
  };
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
      case PkgName.RUSTFMT:
        return await import("@solana-playground/rustfmt-wasm");
      case PkgName.SEAHORSE_COMPILE:
        return await import("@solana-playground/seahorse-compile-wasm");
      case PkgName.SOLANA_CLI:
        return await import("@solana-playground/solana-cli-wasm");
      case PkgName.SPL_TOKEN_CLI:
        return await import("@solana-playground/spl-token-cli-wasm");
    }
  }
}
