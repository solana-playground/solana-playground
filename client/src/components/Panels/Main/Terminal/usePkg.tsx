import { useCallback, useEffect, useState } from "react";

import { EventName, GITHUB_URL } from "../../../../constants";
import {
  PgPkg,
  PgTerminal,
  PkgInfo,
  PkgName,
  Pkgs,
} from "../../../../utils/pg";

export const usePkg = () => {
  const [pkgs, setPkgs] = useState<Pkgs>();

  const loadPkg = useCallback(async (pkgInfo: PkgInfo) => {
    PgTerminal.logWasm(PgTerminal.info(`Loading ${pkgInfo.uiName}...`));

    let resultMsg;

    try {
      // Unfortunately we can't dynamically import packages with variable name
      const pkg = await PgPkg.loadPkg(pkgInfo.name);

      setPkgs((w) => ({ ...w, ...pkg }));
      resultMsg = `${PgTerminal.success("Success.")}`;

      // This prevents unnecessary looping
      setTimeout(() => PgTerminal.runLastCmd());
    } catch (e: any) {
      resultMsg = `${PgTerminal.error("Error")} loading ${
        pkgInfo.uiName
      }. Please consider filing a bug report in ${PgTerminal.underline(
        GITHUB_URL + "/issues"
      )}
  Error reason: ${e.message}`;
      PgTerminal.enable();
    } finally {
      PgTerminal.logWasm(resultMsg + "\n");
    }
  }, []);

  // Load solana cli only when user first enters a solana command
  useEffect(() => {
    const handleLoadPkg = (e: UIEvent & { detail: { pkg: PkgName } }) => {
      const pkg = e.detail.pkg as PkgName;
      if (pkg === PkgName.SOLANA_CLI) loadPkg(PgPkg.SOLANA_CLI);
      else if (pkg === PkgName.SPL_TOKEN_CLI) loadPkg(PgPkg.SPL_TOKEN_CLI);
    };

    document.addEventListener(
      EventName.TERMINAL_LOAD_PKG,
      handleLoadPkg as EventListener
    );
    return () =>
      document.removeEventListener(
        EventName.TERMINAL_LOAD_PKG,
        handleLoadPkg as EventListener
      );
  }, [pkgs, loadPkg]);

  return pkgs;
};
