import { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";

import { terminalOutputAtom } from "../../../../state";
import { GITHUB_URL } from "../../../../constants";
import {
  PgPkg,
  PgTerminal,
  PkgInfo,
  PkgName,
  Pkgs,
} from "../../../../utils/pg";

export const usePkg = () => {
  const [, setTerminalText] = useAtom(terminalOutputAtom);

  const [pkgs, setPkgs] = useState<Pkgs>();

  const loadPkg = useCallback(
    async (pkgInfo: PkgInfo) => {
      setTerminalText(PgTerminal.info(`Loading ${pkgInfo.uiName}...`));
      let resultMsg = "";

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
        setTerminalText(resultMsg + "\n");
      }
    },
    [setTerminalText]
  );

  // Load solana cli only when user first enters a solana command
  useEffect(() => {
    const handleLoadPkg = (e: UIEvent) => {
      // @ts-ignore
      const pkg = e.detail.pkg as PkgName;
      if (pkg === PkgName.SOLANA_CLI) loadPkg(PgPkg.SOLANA_CLI);
      else if (pkg === PkgName.SPL_TOKEN_CLI) loadPkg(PgPkg.SPL_TOKEN_CLI);
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_LOAD_PKG,
      handleLoadPkg as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_LOAD_PKG,
        handleLoadPkg as EventListener
      );
  }, [pkgs, loadPkg]);

  // Listen for custom terminal events
  useEffect(() => {
    const handleLog = (e: UIEvent) => {
      // @ts-ignore
      setTerminalText(e.detail.msg);
    };

    document.addEventListener(
      PgTerminal.EVT_NAME_TERMINAL_LOG,
      handleLog as EventListener
    );
    return () =>
      document.removeEventListener(
        PgTerminal.EVT_NAME_TERMINAL_LOG,
        handleLog as EventListener
      );
  }, [setTerminalText]);

  return pkgs;
};
